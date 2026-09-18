import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function ThreatGlobe3D() {
  const mountRef = useRef(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const w = container.clientWidth || 400
    const h = container.clientHeight || 300

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000)
    camera.position.z = 4.5

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const globeGroup = new THREE.Group()
    scene.add(globeGroup)

    // Wireframe Sphere
    const sphereGeo = new THREE.IcosahedronGeometry(1.6, 3)
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    })
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat)
    globeGroup.add(sphereMesh)

    // Inner Glowing Core
    const innerGeo = new THREE.SphereGeometry(1.2, 32, 32)
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x0d1b38,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.2,
      roughness: 0.5
    })
    const innerMesh = new THREE.Mesh(innerGeo, innerMat)
    globeGroup.add(innerMesh)

    // Node Points & Arc Connections
    const nodesCount = 35
    const nodesGeo = new THREE.BufferGeometry()
    const nodePositions = new Float32Array(nodesCount * 3)
    const colors = new Float32Array(nodesCount * 3)

    const cyanColor = new THREE.Color(0x00f0ff)
    const alertColor = new THREE.Color(0xef4444)

    for (let i = 0; i < nodesCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodesCount)
      const theta = Math.sqrt(nodesCount * Math.PI) * phi
      const r = 1.62

      const x = r * Math.cos(theta) * Math.sin(phi)
      const y = r * Math.sin(theta) * Math.sin(phi)
      const z = r * Math.cos(phi)

      nodePositions[i * 3] = x
      nodePositions[i * 3 + 1] = y
      nodePositions[i * 3 + 2] = z

      const isThreat = i % 7 === 0
      const col = isThreat ? alertColor : cyanColor
      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
    }

    nodesGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3))
    nodesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const nodesMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    })
    const nodesMesh = new THREE.Points(nodesGeo, nodesMat)
    globeGroup.add(nodesMesh)

    // Arc Curves for Transactions
    for (let i = 0; i < 6; i++) {
      const idx1 = Math.floor(Math.random() * nodesCount)
      const idx2 = Math.floor(Math.random() * nodesCount)

      const p1 = new THREE.Vector3(nodePositions[idx1 * 3], nodePositions[idx1 * 3 + 1], nodePositions[idx1 * 3 + 2])
      const p2 = new THREE.Vector3(nodePositions[idx2 * 3], nodePositions[idx2 * 3 + 1], nodePositions[idx2 * 3 + 2])

      const mid = p1.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(2.2)

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2)
      const points = curve.getPoints(30)
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points)

      const curveMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0x00f0ff : 0x7000ff,
        transparent: true,
        opacity: 0.6
      })
      const curveLine = new THREE.Line(curveGeo, curveMat)
      globeGroup.add(curveLine)
    }

    // Outer Halo Ring
    const haloGeo = new THREE.TorusGeometry(2.1, 0.01, 16, 100)
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 })
    const haloMesh = new THREE.Mesh(haloGeo, haloMat)
    haloMesh.rotation.x = Math.PI / 2.5
    globeGroup.add(haloMesh)

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(amb)

    const pl1 = new THREE.PointLight(0x00f0ff, 2, 10)
    pl1.position.set(3, 3, 3)
    scene.add(pl1)

    // Mouse Interaction
    let mouseX = 0, mouseY = 0
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect()
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
    window.addEventListener('mousemove', handleMouseMove)

    const handleResize = () => {
      if (!container) return
      const nw = container.clientWidth
      const nh = container.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', handleResize)

    let reqId
    const clock = new THREE.Clock()

    const animate = () => {
      reqId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      globeGroup.rotation.y = t * 0.2 + mouseX * 0.4
      globeGroup.rotation.x = Math.sin(t * 0.1) * 0.1 + mouseY * 0.2

      haloMesh.rotation.z = t * 0.3

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(reqId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} className="w-full h-full min-h-[260px] cursor-grab active:cursor-grabbing" />
}

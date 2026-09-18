import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function CyberShield3D({ width = '100%', height = '100%' }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const w = container.clientWidth || 400
    const h = container.clientHeight || 400

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000)
    camera.position.z = 7

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const shieldGroup = new THREE.Group()
    scene.add(shieldGroup)

    // Outer Shield Shape using ExtrudeGeometry or Custom Mesh
    const shape = new THREE.Shape()
    shape.moveTo(0, 1.8)
    shape.quadraticCurveTo(1.5, 1.5, 1.6, 0.2)
    shape.quadraticCurveTo(1.6, -1.2, 0, -2.1)
    shape.quadraticCurveTo(-1.6, -1.2, -1.6, 0.2)
    shape.quadraticCurveTo(-1.5, 1.5, 0, 1.8)

    const extrudeSettings = { depth: 0.2, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.08, bevelThickness: 0.08 }
    const shieldGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    shieldGeo.center()

    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x091b36,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.15,
      metalness: 0.8,
      roughness: 0.2,
      wireframe: false,
      transparent: true,
      opacity: 0.85
    })
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat)
    shieldGroup.add(shieldMesh)

    // Wireframe Overlay Shield
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    })
    const wireMesh = new THREE.Mesh(shieldGeo, wireMat)
    wireMesh.scale.set(1.02, 1.02, 1.02)
    shieldGroup.add(wireMesh)

    // Inner Glowing Core Icon / Emblem
    const coreGeo = new THREE.IcosahedronGeometry(0.7, 2)
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x7000ff,
      emissive: 0x7000ff,
      emissiveIntensity: 0.8,
      wireframe: true
    })
    const coreMesh = new THREE.Mesh(coreGeo, coreMat)
    shieldGroup.add(coreMesh)

    // Orbital Rings
    const createRing = (radius, color, rotX, rotY) => {
      const ringGeo = new THREE.TorusGeometry(radius, 0.015, 16, 100)
      const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.rotation.x = rotX
      ringMesh.rotation.y = rotY
      return ringMesh
    }

    const ring1 = createRing(2.2, 0x00f0ff, Math.PI / 3, 0)
    const ring2 = createRing(2.5, 0x7000ff, -Math.PI / 4, Math.PI / 6)
    shieldGroup.add(ring1)
    shieldGroup.add(ring2)

    // Floating Data Particles
    const particlesCount = 200
    const particleGeo = new THREE.BufferGeometry()
    const posArray = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 8
      posArray[i + 1] = (Math.random() - 0.5) * 8
      posArray[i + 2] = (Math.random() - 0.5) * 8
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    })
    const particleSystem = new THREE.Points(particleGeo, particleMat)
    scene.add(particleSystem)

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0x00f0ff, 2, 10)
    pointLight1.position.set(2, 3, 4)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x7000ff, 2, 10)
    pointLight2.position.set(-2, -3, 2)
    scene.add(pointLight2)

    // Mouse Parallax Interaction
    let mouseX = 0, mouseY = 0
    let targetX = 0, targetY = 0

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      mouseX = (x / rect.width) * 0.5
      mouseY = (y / rect.height) * 0.5
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return
      const nw = container.clientWidth
      const nh = container.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }

    window.addEventListener('resize', handleResize)

    // Animation Loop
    let reqId
    const clock = new THREE.Clock()

    const animate = () => {
      reqId = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()

      targetX += (mouseX - targetX) * 0.05
      targetY += (mouseY - targetY) * 0.05

      shieldGroup.rotation.y = elapsedTime * 0.4 + targetX * 1.5
      shieldGroup.rotation.x = Math.sin(elapsedTime * 0.3) * 0.15 + targetY * 1.5

      ring1.rotation.z = elapsedTime * 0.2
      ring2.rotation.z = -elapsedTime * 0.3

      coreMesh.rotation.x = elapsedTime * 0.8
      coreMesh.rotation.y = elapsedTime * 0.5

      particleSystem.rotation.y = elapsedTime * 0.05

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

  return (
    <div ref={mountRef} className="relative w-full h-full min-h-[320px] flex items-center justify-center overflow-hidden">
      {/* Fallback glow background */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none opacity-40" />
    </div>
  )
}

import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'

const COLOR_MAP = {
  account: 0x00f0ff,  // Cyan
  upi: 0x8b5cf6,      // Violet
  device: 0xf59e0b,   // Amber
  location: 0x10b981, // Emerald
  flagged: 0xef4444   // Red
}

export default function NetworkGraph3D({ data, onSelectNode }) {
  const mountRef = useRef(null)
  const [selectedNode, setSelectedNode] = useState(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container || !data?.nodes?.length) return

    const w = container.clientWidth || 600
    const h = container.clientHeight || 500

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000)
    camera.position.set(0, 0, 8)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const graphGroup = new THREE.Group()
    scene.add(graphGroup)

    // Compute positions in 3D sphere layout
    const root = data.nodes.find((n) => n.root) || data.nodes[0]
    const nodeMap = {}
    const nodeMeshes = []
    const raycastObjects = []

    const count = data.nodes.length
    data.nodes.forEach((node, i) => {
      let pos
      if (node.id === root.id) {
        pos = new THREE.Vector3(0, 0, 0)
      } else {
        const phi = Math.acos(-1 + (2 * i) / count)
        const theta = Math.sqrt(count * Math.PI) * phi
        const r = 2.8 + (i % 3) * 0.4
        pos = new THREE.Vector3(
          r * Math.cos(theta) * Math.sin(phi),
          r * Math.sin(theta) * Math.sin(phi),
          r * Math.cos(phi)
        )
      }
      nodeMap[node.id] = { ...node, pos }

      const isRisky = (node.risk || 0) >= 70
      const colorHex = isRisky ? COLOR_MAP.flagged : (COLOR_MAP[node.type] || COLOR_MAP.account)

      const geo = new THREE.SphereGeometry(node.root ? 0.35 : 0.22, 24, 24)
      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: isRisky ? 0.6 : 0.2,
        roughness: 0.3,
        metalness: 0.5
      })

      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(pos)
      mesh.userData = node
      graphGroup.add(mesh)
      nodeMeshes.push(mesh)
      raycastObjects.push(mesh)

      // Add Outer Pulse Ring for Flagged Nodes
      if (isRisky) {
        const ringGeo = new THREE.RingGeometry(0.3, 0.42, 32)
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
        const ringMesh = new THREE.Mesh(ringGeo, ringMat)
        ringMesh.position.copy(pos)
        graphGroup.add(ringMesh)
      }
    })

    // Edges Lines
    data.edges.forEach((edge) => {
      const sourceNode = nodeMap[edge.source]
      const targetNode = nodeMap[edge.target]
      if (sourceNode && targetNode) {
        const points = [sourceNode.pos, targetNode.pos]
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
        const lineMat = new THREE.LineBasicMaterial({
          color: edge.suspicious ? 0xef4444 : 0x00f0ff,
          transparent: true,
          opacity: edge.suspicious ? 0.8 : 0.4,
          linewidth: edge.suspicious ? 2 : 1
        })
        const line = new THREE.Line(lineGeo, lineMat)
        graphGroup.add(line)
      }
    })

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(amb)

    const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.5)
    dirLight.position.set(5, 5, 5)
    scene.add(dirLight)

    // Drag / Orbit State
    let isDragging = false
    let previousMousePosition = { x: 0, y: 0 }

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onMouseDown = (e) => {
      isDragging = true
      previousMousePosition = { x: e.clientX, y: e.clientY }
    }

    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      if (isDragging) {
        const deltaMove = {
          x: e.clientX - previousMousePosition.x,
          y: e.clientY - previousMousePosition.y
        }
        graphGroup.rotation.y += deltaMove.x * 0.008
        graphGroup.rotation.x += deltaMove.y * 0.008
        previousMousePosition = { x: e.clientX, y: e.clientY }
      }
    }

    const onMouseUp = () => {
      isDragging = false
    }

    const onClick = (e) => {
      const rect = container.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(raycastObjects)

      if (intersects.length > 0) {
        const clickedData = intersects[0].object.userData
        setSelectedNode(clickedData)
        if (onSelectNode) onSelectNode(clickedData)
      }
    }

    // Zoom on wheel
    const onWheel = (e) => {
      e.preventDefault()
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.005, 3, 15)
    }

    const dom = container
    dom.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    dom.addEventListener('click', onClick)
    dom.addEventListener('wheel', onWheel, { passive: false })

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
    const animate = () => {
      reqId = requestAnimationFrame(animate)
      if (!isDragging) {
        graphGroup.rotation.y += 0.002
      }
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(reqId)
      dom.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      dom.removeEventListener('click', onClick)
      dom.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', handleResize)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [data, onSelectNode])

  return (
    <div className="relative w-full h-[520px] rounded-2xl border border-cyan-500/20 bg-cyber-card/90 overflow-hidden shadow-card">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 3D Controls Overlay Helper */}
      <div className="absolute top-4 left-4 pointer-events-none bg-navy-950/80 backdrop-blur border border-cyan-500/30 rounded-xl px-3 py-2 text-[11px] text-slate-300">
        <p className="font-bold text-cyan-400">3D Interactive Graph</p>
        <p>• Click + Drag to rotate graph</p>
        <p>• Mouse wheel to zoom in/out</p>
        <p>• Click node to inspect details</p>
      </div>

      {/* Selected Node Drawer */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 bg-cyber-panel/95 backdrop-blur border border-cyan-500/40 rounded-2xl p-4 w-72 shadow-glow animate-slideIn">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">Node Selected</span>
            <button onClick={() => setSelectedNode(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
          </div>
          <p className="font-extrabold text-base text-slate-100">{selectedNode.label}</p>
          <div className="mt-2 space-y-1 text-xs text-slate-300">
            <p><span className="text-slate-400">Type:</span> <span className="uppercase font-bold text-cyan-300">{selectedNode.type}</span></p>
            <p><span className="text-slate-400">Risk Score:</span> <span className={`font-bold ${selectedNode.risk >= 70 ? 'text-red-400' : 'text-emerald-400'}`}>{selectedNode.risk || 0} / 100</span></p>
            {selectedNode.root && <p className="text-cyan-400 font-semibold mt-1">★ Root Investigation Subject</p>}
          </div>
        </div>
      )}
    </div>
  )
}

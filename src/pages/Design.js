import React, { useRef, useState, useEffect } from 'react'
import interact from 'interactjs'

import './Design.css'

// Check if rects are intersecting
function isIntersecting(rect1, rect2) {
  return !(
    rect1.left + rect1.width < rect2.left ||
    rect1.left > rect2.left + rect2.width ||
    rect1.top + rect1.height < rect2.top ||
    rect1.top > rect2.top + rect2.height
  )
}

// Clip as close as possible
function calculateClip(immoving, moving) {
  let closestX = moving.left
  let closestY = moving.top

  if (
    moving.left + moving.width > immoving.left &&
    moving.left < immoving.left + immoving.width &&
    moving.top + moving.height > immoving.top &&
    moving.top < immoving.top + immoving.height
  ) {
    // Calculate the overlap in X and Y directions
    const overlapX = Math.min(
      Math.abs(moving.left + moving.width - immoving.left),
      Math.abs(immoving.left + immoving.width - moving.left)
    )
    const overlapY = Math.min(
      Math.abs(moving.top + moving.height - immoving.top),
      Math.abs(immoving.top + immoving.height - moving.top)
    )

    // Adjust the position to the closest valid position
    if (overlapX < overlapY) {
      // Move horizontally
      if (moving.left < immoving.left) {
        closestX = immoving.left - moving.width // Move left
      } else {
        closestX = immoving.left + immoving.width // Move right
      }
    } else {
      // Move vertically
      if (moving.top < immoving.top) {
        closestY = immoving.top - moving.height // Move up
      } else {
        closestY = immoving.top + immoving.height // Move down
      }
    }
  }

  return { left: closestX, top: closestY }
}

// Individual Compartment Component
const Compartment = ({ id, text, left, top, width, height, onMove, isIntersecting, isMoving, anyMoving }) => {

  const dragRef = useRef(null)

  useEffect(() => {
    interact(dragRef.current).draggable({
      listeners: {
        move: (event) => {

          const target = event.target
          const x = (parseFloat(target.style.left) || 0) + event.dx
          const y = (parseFloat(target.style.top) || 0) + event.dy

          onMove(id, x, y)
        },
      },
    })
  }, [id, onMove])

  return (
    <div
      ref={dragRef}
      style={{
        position: 'absolute',
        left, top,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: isIntersecting ? 'red' : 'white',
        cursor: 'move',
        zIndex: isMoving ? 999 : 1,
      }}
      className="compartment"
    >
      {text}
    </div>
  )
}

const Holder = ({ width, height, compartments, onMoveCompartment, anyMoving }) => {

  return (
    <div
      id="holder"
      style={{ width: `${width}px`, height: `${height}px`, }}
    >
      {compartments.map((comp) => (
        <Compartment
          {...comp}
          key={comp.id}
          id={comp.id}
          text={comp.text}
          left={comp.left}
          top={comp.top}
          onMove={onMoveCompartment}
          isIntersecting={comp.isIntersecting}
          isMoving={comp.isMoving}
          anyMoving={anyMoving}
        />
      ))}
    </div>
  )
}

function Design() {

  let holderDims = JSON.parse(localStorage['holderDims'])

  // Scale holder
  let width, height
  if (holderDims.length > holderDims.width) {
    width = 50
    height = 50 * (holderDims.width / holderDims.length)
  } else {
    height = 50
    width = 50 * (holderDims.length / holderDims.width)
  }
  width *= window.innerHeight / 100
  height *= window.innerHeight / 100

  // Get ratio of mm to pixel
  const mmToPixel = height / holderDims.width

  const [compartments, setCompartments] = useState([
    { id: '1', text: 'Compartment 1', left: 50, top: 50, width: 100, height: 100 },
    { id: '2', text: 'Compartment 2', left: 200, top: 200, width: 200, height: 50 },
  ])

  const onMoveCompartment = (id, x, y) => {

    setCompartments((prev) =>
      prev.map((comp) => {

        if (comp.id === id) {

          let updatedComp = { ...comp, left: x, top: y, isMoving: true }

          const { hasIntersect, toClip } = prev.reduce((acc, otherComp) => {

            if (otherComp.id === id) return acc
            const moving = { left: x, top: y, width: comp.width, height: comp.height }
            const immoving = {
              left: otherComp.left - 2 * mmToPixel, // Compartments must be 4mm apart
              top: otherComp.top - 2 * mmToPixel,
              width: otherComp.width + 4 * mmToPixel,
              height: otherComp.height + 4 * mmToPixel
            }

            const hasIntersect = isIntersecting(moving, immoving)
            if (hasIntersect) {
              return {hasIntersect: true, toClip: calculateClip(immoving, moving)}
            }
            return acc

          }, { hasIntersect: false, toClip: null })

          updatedComp.isIntersecting = hasIntersect
          console.log(toClip)
          if (hasIntersect) {
            updatedComp = { ...updatedComp, ...toClip }
          }
          return updatedComp
        }

        return { ...comp, isMoving: false }
      })
    )
  }

  return (
    <div id="canvas">
      <div className="row">
        <div className="dimension">
          <span>{holderDims.width} mm</span>
          <span className="arrow">↕</span>
        </div>
        <Holder width={width} height={height} compartments={compartments} onMoveCompartment={onMoveCompartment} />
      </div>
      <div className="dimension" style={{ paddingLeft: "40px" }}>
        <span>{holderDims.length} mm</span>
        <span className="arrow">↔</span>
      </div>
    </div>
  )
}

export default Design
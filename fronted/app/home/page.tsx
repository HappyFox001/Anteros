/**
 * Home Page - Anteros Interactive Experience
 *
 * @remarks
 * Welcome to the Anteros platform's immersive home page. This page serves as the gateway to our
 * decentralized trading ecosystem, featuring a visually stunning cyberpunk-inspired design.
 * 
 * Key features:
 * - Interactive pixel-art animation with dynamic text rendering
 * - Physics-based collision system that responds to user interaction
 * - Neon-themed visual elements with glow effects that pulse and react
 * - Seamless transition effects when navigating to other sections
 * - Press-and-hold interaction pattern for intentional navigation
 * 
 * The home page establishes the futuristic aesthetic of the platform while providing
 * an engaging entry point that introduces users to the Anteros experience through
 * interactive visual elements rather than traditional UI components.
 *
 * @packageDocumentation
 */


"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

const CYBERPUNK_COLORS = [
  "#FF00FF",
  "#00FFFF",
  "#FF3366",
  "#66FF33",
  "#3366FF",
  "#FFFF00",
  "#FF9900",
]
const PREMIUM_WHITE = "rgba(255, 255, 255, 0.7)" 
const COLOR = "#FFFFFF"
const HIT_COLOR = "#333333"
const BACKGROUND_COLOR = "#0A0A0F"
const BALL_COLOR = "#00FFFF"
const PADDLE_COLOR = "#FF00FF"
const LETTER_SPACING = 1
const WORD_SPACING = 3

const PIXEL_MAP = {
  P: [
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
  ],
  R: [
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
    [1, 0, 1, 0],
    [1, 0, 0, 1],
  ],
  O: [
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
  ],
  M: [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  T: [
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  I: [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1],
  ],
  N: [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 1, 1],
    [1, 0, 0, 0, 1],
  ],
  G: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ],
  S: [
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [1, 1, 1, 1],
  ],
  A: [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
  ],
  L: [
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 1, 1, 1],
  ],
  Y: [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  U: [
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
  ],
  D: [
    [1, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 0],
  ],
  E: [
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 1, 1, 1],
  ],
}

interface Pixel {
  x: number
  y: number
  size: number
  hit: boolean
  color: string
  glowIntensity: number
}

interface Ball {
  x: number
  y: number
  dx: number
  dy: number
  radius: number
}

interface Paddle {
  x: number
  y: number
  width: number
  height: number
  targetY: number
  isVertical: boolean
}

export function AnterosIsAllYouNeed() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pixelsRef = useRef<Pixel[]>([])
  const ballRef = useRef<Ball>({ x: 0, y: 0, dx: 0, dy: 0, radius: 0 })
  const paddlesRef = useRef<Paddle[]>([])
  const scaleRef = useRef(1)
  const [fadeProgress, setFadeProgress] = useState(0)
  const pressStartTimeRef = useRef<number | null>(null)
  const fadeAnimationRef = useRef<number | null>(null)
  const shouldNavigateRef = useRef(false)

  useEffect(() => {
    if (fadeProgress >= 1 && !shouldNavigateRef.current) {
      shouldNavigateRef.current = true
      router.push('/next')
    }
  }, [fadeProgress, router])

  const handlePressStart = () => {
    pressStartTimeRef.current = Date.now()
    startFadeAnimation()
  }

  const handlePressEnd = () => {
    pressStartTimeRef.current = null
    if (fadeAnimationRef.current !== null) {
      cancelAnimationFrame(fadeAnimationRef.current)
      fadeAnimationRef.current = null
    }
    if (fadeProgress < 1) {
      setFadeProgress(0)
      shouldNavigateRef.current = false
    }
  }

  const startFadeAnimation = () => {
    const animate = () => {
      setFadeProgress(prev => {
        const newProgress = prev + 0.01
        if (newProgress >= 1) {
          return 1
        }
        fadeAnimationRef.current = requestAnimationFrame(animate)
        return newProgress
      })
    }
    fadeAnimationRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      scaleRef.current = Math.min(canvas.width / 1000, canvas.height / 1000)
      initializeGame()
    }

    const initializeGame = () => {
      const scale = scaleRef.current
      const LARGE_PIXEL_SIZE = 8 * scale
      const SMALL_PIXEL_SIZE = 4 * scale
      const BALL_SPEED = 6 * scale

      pixelsRef.current = []
      const words = ["ANTEROS", "ATTENTION", "IS ALL YOU NEED"]

      const calculateWordWidth = (word: string, pixelSize: number) => {
        return (
          word.split("").reduce((width, letter) => {
            const letterWidth = PIXEL_MAP[letter as keyof typeof PIXEL_MAP]?.[0]?.length ?? 0
            return width + letterWidth * pixelSize + LETTER_SPACING * pixelSize
          }, 0) -
          LETTER_SPACING * pixelSize
        )
      }

      const totalWidthLarge = calculateWordWidth(words[0], LARGE_PIXEL_SIZE)
      const totalWidthMedium = calculateWordWidth(words[1], SMALL_PIXEL_SIZE)
      const totalWidthSmall = words[2].split(" ").reduce((width, word, index) => {
        return width + calculateWordWidth(word, SMALL_PIXEL_SIZE) + (index > 0 ? WORD_SPACING * SMALL_PIXEL_SIZE : 0)
      }, 0)
      const totalWidth = Math.max(totalWidthLarge, totalWidthMedium, totalWidthSmall)
      const scaleFactor = (canvas.width * 0.8) / totalWidth

      const adjustedLargePixelSize = LARGE_PIXEL_SIZE * scaleFactor
      const adjustedSmallPixelSize = SMALL_PIXEL_SIZE * scaleFactor

      const largeTextHeight = 5 * adjustedLargePixelSize
      const smallTextHeight = 5 * adjustedSmallPixelSize
      const spaceBetweenLines = 3 * adjustedLargePixelSize
      const totalTextHeight = largeTextHeight + spaceBetweenLines * 2 + smallTextHeight * 2

      let startY = (canvas.height - totalTextHeight) / 2

      words.forEach((word, wordIndex) => {
        const pixelSize = wordIndex === 0 ? adjustedLargePixelSize : adjustedSmallPixelSize
        let totalWidth;
        
        if (wordIndex === 0) {
          totalWidth = calculateWordWidth(word, adjustedLargePixelSize);
        } else if (wordIndex === 1) {
          totalWidth = calculateWordWidth(word, adjustedSmallPixelSize);
        } else {
          totalWidth = word.split(" ").reduce((width, w, index) => {
            return (
              width +
              calculateWordWidth(w, adjustedSmallPixelSize) +
              (index > 0 ? WORD_SPACING * adjustedSmallPixelSize : 0)
            )
          }, 0);
        }

        let startX = (canvas.width - totalWidth) / 2

        if (wordIndex === 2) {
          word.split(" ").forEach((subWord) => {
            subWord.split("").forEach((letter) => {
              const pixelMap = PIXEL_MAP[letter as keyof typeof PIXEL_MAP]
              if (!pixelMap) return

              for (let i = 0; i < pixelMap.length; i++) {
                for (let j = 0; j < pixelMap[i].length; j++) {
                  if (pixelMap[i][j]) {
                    const x = startX + j * pixelSize
                    const y = startY + i * pixelSize
                    const color = CYBERPUNK_COLORS[Math.floor(Math.random() * CYBERPUNK_COLORS.length)]
                    const glowIntensity = 0.5 + Math.random() * 0.5
                    pixelsRef.current.push({ x, y, size: pixelSize, hit: false, color, glowIntensity })
                  }
                }
              }
              startX += (pixelMap[0].length + LETTER_SPACING) * pixelSize
            })
            startX += WORD_SPACING * adjustedSmallPixelSize
          })
        } else {
          word.split("").forEach((letter) => {
            const pixelMap = PIXEL_MAP[letter as keyof typeof PIXEL_MAP]
            if (!pixelMap) return

            for (let i = 0; i < pixelMap.length; i++) {
              for (let j = 0; j < pixelMap[i].length; j++) {
                if (pixelMap[i][j]) {
                  const x = startX + j * pixelSize
                  const y = startY + i * pixelSize

                  let color;
                  let glowIntensity;
                  
                  if (wordIndex === 0) {
                    color = PREMIUM_WHITE
                    glowIntensity = 0.9
                  } else {
                    color = CYBERPUNK_COLORS[Math.floor(Math.random() * CYBERPUNK_COLORS.length)]
                    glowIntensity = 0.5 + Math.random() * 0.5
                  }
                  
                  pixelsRef.current.push({ x, y, size: pixelSize, hit: false, color, glowIntensity })
                }
              }
            }
            startX += (pixelMap[0].length + LETTER_SPACING) * pixelSize
          })
        }
        
        if (wordIndex === 0) {
          startY += largeTextHeight + spaceBetweenLines;
        } else if (wordIndex === 1) {
          startY += smallTextHeight + spaceBetweenLines;
        }
      })

      const ballStartX = canvas.width * 0.9
      const ballStartY = canvas.height * 0.1

      ballRef.current = {
        x: ballStartX,
        y: ballStartY,
        dx: -BALL_SPEED,
        dy: BALL_SPEED,
        radius: adjustedLargePixelSize / 2,
      }

      const paddleWidth = adjustedLargePixelSize
      const paddleLength = 10 * adjustedLargePixelSize

      paddlesRef.current = [
        {
          x: 0,
          y: canvas.height / 2 - paddleLength / 2,
          width: paddleWidth,
          height: paddleLength,
          targetY: canvas.height / 2 - paddleLength / 2,
          isVertical: true,
        },
        {
          x: canvas.width - paddleWidth,
          y: canvas.height / 2 - paddleLength / 2,
          width: paddleWidth,
          height: paddleLength,
          targetY: canvas.height / 2 - paddleLength / 2,
          isVertical: true,
        },
        {
          x: canvas.width / 2 - paddleLength / 2,
          y: 0,
          width: paddleLength,
          height: paddleWidth,
          targetY: canvas.width / 2 - paddleLength / 2,
          isVertical: false,
        },
        {
          x: canvas.width / 2 - paddleLength / 2,
          y: canvas.height - paddleWidth,
          width: paddleLength,
          height: paddleWidth,
          targetY: canvas.width / 2 - paddleLength / 2,
          isVertical: false,
        },
      ]
    }

    const updateGame = () => {
      const ball = ballRef.current
      const paddles = paddlesRef.current

      ball.x += ball.dx
      ball.y += ball.dy

      if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy
      }
      if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.dx = -ball.dx
      }

      paddles.forEach((paddle) => {
        if (paddle.isVertical) {
          if (
            ball.x - ball.radius < paddle.x + paddle.width &&
            ball.x + ball.radius > paddle.x &&
            ball.y > paddle.y &&
            ball.y < paddle.y + paddle.height
          ) {
            ball.dx = -ball.dx
          }
        } else {
          if (
            ball.y - ball.radius < paddle.y + paddle.height &&
            ball.y + ball.radius > paddle.y &&
            ball.x > paddle.x &&
            ball.x < paddle.x + paddle.width
          ) {
            ball.dy = -ball.dy
          }
        }
      })

      paddles.forEach((paddle) => {
        if (paddle.isVertical) {
          paddle.targetY = ball.y - paddle.height / 2
          paddle.targetY = Math.max(0, Math.min(canvas.height - paddle.height, paddle.targetY))
          paddle.y += (paddle.targetY - paddle.y) * 0.1
        } else {
          paddle.targetY = ball.x - paddle.width / 2
          paddle.targetY = Math.max(0, Math.min(canvas.width - paddle.width, paddle.targetY))
          paddle.x += (paddle.targetY - paddle.x) * 0.1
        }
      })

      pixelsRef.current.forEach((pixel) => {
        const isAnteros = pixel.color === PREMIUM_WHITE;
        
        if (
          !pixel.hit &&
          !isAnteros &&
          ball.x + ball.radius > pixel.x &&
          ball.x - ball.radius < pixel.x + pixel.size &&
          ball.y + ball.radius > pixel.y &&
          ball.y - ball.radius < pixel.y + pixel.size
        ) {
          pixel.hit = true
          const centerX = pixel.x + pixel.size / 2
          const centerY = pixel.y + pixel.size / 2
          if (Math.abs(ball.x - centerX) > Math.abs(ball.y - centerY)) {
            ball.dx = -ball.dx
          } else {
            ball.dy = -ball.dy
          }
        }
      })
    }

    const drawGame = () => {
      if (!ctx) return

      ctx.fillStyle = BACKGROUND_COLOR
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      const anterosPixels = pixelsRef.current.filter(pixel => pixel.color === PREMIUM_WHITE && !pixel.hit);
      const otherPixels = pixelsRef.current.filter(pixel => pixel.color !== PREMIUM_WHITE || pixel.hit);
      
      otherPixels.forEach((pixel) => {
        if (pixel.hit) {
          ctx.fillStyle = `rgba(51, 51, 51, ${1 - fadeProgress})`
          ctx.fillRect(pixel.x, pixel.y, pixel.size, pixel.size)
        } else {
          const glow = pixel.glowIntensity * (0.7 + 0.3 * Math.sin(Date.now() / 500))
          ctx.shadowColor = pixel.color
          ctx.shadowBlur = pixel.size * glow
          
          ctx.fillStyle = `${pixel.color}${Math.floor((1 - fadeProgress) * 255).toString(16).padStart(2, '0')}`
          ctx.fillRect(pixel.x, pixel.y, pixel.size, pixel.size)
          
          ctx.shadowBlur = 0
        }
      })

      ctx.shadowColor = BALL_COLOR
      ctx.shadowBlur = ballRef.current.radius * 1.5
      ctx.fillStyle = `${BALL_COLOR}${Math.floor((1 - fadeProgress) * 255).toString(16).padStart(2, '0')}`
      ctx.beginPath()
      ctx.arc(ballRef.current.x, ballRef.current.y, ballRef.current.radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowColor = PADDLE_COLOR
      ctx.shadowBlur = 10 * scaleRef.current
      ctx.fillStyle = `${PADDLE_COLOR}${Math.floor((1 - fadeProgress) * 255).toString(16).padStart(2, '0')}`
      paddlesRef.current.forEach((paddle) => {
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height)
      })

      anterosPixels.forEach((pixel) => {
        const glow = pixel.glowIntensity * (0.7 + 0.3 * Math.sin(Date.now() / 500))
        ctx.shadowColor = "rgba(255, 255, 255, 0.9)"
        ctx.shadowBlur = pixel.size * glow * 1.5 

        ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * (1 - fadeProgress)})`
        ctx.fillRect(pixel.x, pixel.y, pixel.size, pixel.size)
        
        ctx.shadowBlur = 0
      })
      
      ctx.shadowBlur = 0
    }

    const gameLoop = () => {
      updateGame()
      drawGame()
      requestAnimationFrame(gameLoop)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    gameLoop()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (fadeAnimationRef.current) {
        cancelAnimationFrame(fadeAnimationRef.current)
      }
    }
  }, [fadeProgress, router])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full"
      aria-label="Prompting Is All You Need: Fullscreen Pong game with pixel text"
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    />
  )
}

export default AnterosIsAllYouNeed

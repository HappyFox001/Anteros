"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"

interface TrendingKeyword {
  keyword: string
  price: number
  change: number
}

export default function TrendingGallery() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const bubblesRef = useRef<Array<{
    x: number,
    y: number,
    radius: number,
    dx: number,
    dy: number,
    color: string,
    glowColor: string,
    glowIntensity: number,
    opacity: number,
    keyword: TrendingKeyword
    lastUpdate: number
  }>>([])
  const [keywords] = useState<TrendingKeyword[]>([
    { keyword: "Trump", price: 78, change: 5.2 },
    { keyword: "OpenAI", price: 45, change: -2.3 },
    { keyword: "Claude", price: 32, change: -8.1 },
    { keyword: "GPT 4O", price: 56, change: 3.7 },
    { keyword: "Aptos", price: 67, change: 1.2 },
    { keyword: "Solana", price: 100, change: 2.5 },
    { keyword: "Cardano", price: 120, change: 1.8 },
    { keyword: "Earthquake", price: 150, change: 0.5 },
  ])
  const animationRef = useRef<number | null>(null)
  const [hoveredKeyword, setHoveredKeyword] = useState<string | null>(null)
  const router = useRouter()

  const checkCollision = (b1: typeof bubblesRef.current[0], b2: typeof bubblesRef.current[0]) => {
    const dx = b2.x - b1.x
    const dy = b2.y - b1.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < (b1.radius + b2.radius)
  }

  const handleCollision = (b1: typeof bubblesRef.current[0], b2: typeof bubblesRef.current[0]) => {
    const dx = b2.x - b1.x
    const dy = b2.y - b1.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < (b1.radius + b2.radius)) {
      const angle = Math.atan2(dy, dx)
      const sin = Math.sin(angle)
      const cos = Math.cos(angle)
      
      const vx1 = b1.dx * cos + b1.dy * sin
      const vy1 = b1.dy * cos - b1.dx * sin
      const vx2 = b2.dx * cos + b2.dy * sin
      const vy2 = b2.dy * cos - b2.dx * sin
      
      const vx1Final = vx2 * 0.98
      const vx2Final = vx1 * 0.98
      
      b1.dx = vx1Final * cos - vy1 * sin
      b1.dy = vy1 * cos + vx1Final * sin
      b2.dx = vx2Final * cos - vy2 * sin
      b2.dy = vy2 * cos + vx2Final * sin
      
      // Create a small "spark" effect on collision
      b1.glowIntensity = Math.min(b1.glowIntensity + 0.3, 1.5);
      b2.glowIntensity = Math.min(b2.glowIntensity + 0.3, 1.5);
      
      const overlap = (b1.radius + b2.radius - distance) / 2
      const moveX = overlap * Math.cos(angle)
      const moveY = overlap * Math.sin(angle)
      
      b1.x -= moveX * 0.5
      b1.y -= moveY * 0.5
      b2.x += moveX * 0.5
      b2.y += moveY * 0.5
    }
  }

  const initBubbles = (canvas: HTMLCanvasElement) => {
    // Cyberpunk color palette
    const cyberpunkColors = [
      { main: "#FF00FF", glow: "#FF66FF" }, // Magenta
      { main: "#00FFFF", glow: "#66FFFF" }, // Cyan
      { main: "#FF3366", glow: "#FF6699" }, // Hot pink
      { main: "#66FF33", glow: "#99FF66" }, // Neon green
      { main: "#3366FF", glow: "#6699FF" }, // Electric blue
      { main: "#FFFF00", glow: "#FFFF66" }, // Yellow
      { main: "#FF9900", glow: "#FFCC66" }, // Orange
    ];
    
    const newBubbles = keywords.map(keyword => {
      const radius = 40 + (keyword.price * 0.8)
      const x = Math.random() * (canvas.width - radius * 2) + radius
      const y = Math.random() * (canvas.height - radius * 2) + radius
      // Increased initial speed
      const dx = (Math.random() - 0.5) * 6.0
      const dy = (Math.random() - 0.5) * 6.0
      
      // Select a random cyberpunk color pair
      const colorPair = cyberpunkColors[Math.floor(Math.random() * cyberpunkColors.length)]
      
      return { 
        x, y, radius, dx, dy, 
        color: colorPair.main,
        glowColor: colorPair.glow,
        glowIntensity: 0.7 + Math.random() * 0.3,
        opacity: 0.8,
        keyword,
        lastUpdate: 0
      }
    })
    bubblesRef.current = newBubbles
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initBubbles(canvas)
    }

    const drawBackground = () => {
      if (!ctx) return
      ctx.fillStyle = "#050510" // Darker background for cyberpunk feel
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw a grid with cyberpunk style
      const gridSize = 40
      
      // Draw horizontal grid lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        
        // Create "perspective" effect with fading lines
        const opacity = 0.1 + 0.1 * Math.sin(y / 100 + Date.now() / 5000)
        ctx.strokeStyle = `rgba(0, 255, 255, ${opacity})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
      
      // Draw vertical grid lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        
        // Create "perspective" effect with fading lines
        const opacity = 0.1 + 0.1 * Math.sin(x / 100 + Date.now() / 5000)
        ctx.strokeStyle = `rgba(255, 0, 255, ${opacity})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
      
      // Add some random "data streams" in the background
      for (let i = 0; i < 5; i++) {
        const x = Math.sin(Date.now() / 2000 + i) * canvas.width/2 + canvas.width/2
        const length = 50 + Math.random() * 100
        const speed = 2 + Math.random() * 3
        const startY = (Date.now() / (500 / speed) + i * 200) % (canvas.height + length) - length
        
        ctx.beginPath()
        ctx.moveTo(x, startY)
        ctx.lineTo(x, startY + length)
        
        const gradient = ctx.createLinearGradient(x, startY, x, startY + length)
        gradient.addColorStop(0, "rgba(0, 255, 255, 0)")
        gradient.addColorStop(0.5, "rgba(0, 255, 255, 0.8)")
        gradient.addColorStop(1, "rgba(0, 255, 255, 0)")
        
        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }

    const animate = (timestamp: number) => {
      if (!ctx || !canvas) return
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawBackground()

      const bubbles = bubblesRef.current
      for (let i = 0; i < bubbles.length; i++) {
        const bubble = bubbles[i]

        bubble.x += bubble.dx
        bubble.y += bubble.dy
        
        // More frequent and stronger random movement adjustments
        if (timestamp - bubble.lastUpdate > 300) {
          bubble.dx += (Math.random() - 0.5) * 0.5
          bubble.dy += (Math.random() - 0.5) * 0.5
          bubble.lastUpdate = timestamp
          
          // Gradually reduce glow intensity back to normal
          bubble.glowIntensity = Math.max(0.7, bubble.glowIntensity - 0.1);
        }
        
        // Higher maximum speed
        const speed = Math.sqrt(bubble.dx * bubble.dx + bubble.dy * bubble.dy)
        if (speed > 7.0) {
          bubble.dx = (bubble.dx / speed) * 7.0
          bubble.dy = (bubble.dy / speed) * 7.0
        }
        
        // More energetic bouncing off walls
        if (bubble.x <= bubble.radius || bubble.x >= canvas.width - bubble.radius) {
          bubble.dx *= -0.9
          bubble.x = bubble.x <= bubble.radius ? bubble.radius : canvas.width - bubble.radius
          bubble.glowIntensity = Math.min(bubble.glowIntensity + 0.3, 1.5); // Increase glow on wall collision
        }
        
        if (bubble.y <= bubble.radius || bubble.y >= canvas.height - bubble.radius) {
          bubble.dy *= -0.9
          bubble.y = bubble.y <= bubble.radius ? bubble.radius : canvas.height - bubble.radius
          bubble.glowIntensity = Math.min(bubble.glowIntensity + 0.3, 1.5); // Increase glow on wall collision
        }
        
        // Check collisions with other bubbles
        for (let j = i + 1; j < bubbles.length; j++) {
          const dx = bubbles[j].x - bubble.x;
          const dy = bubbles[j].y - bubble.y;
          const distanceSquared = dx * dx + dy * dy;
          const minDistance = bubble.radius + bubbles[j].radius;
          
          if (distanceSquared < minDistance * minDistance * 1.5) {
            handleCollision(bubble, bubbles[j]);
          }
        }
        
        const isHovered = hoveredKeyword === bubble.keyword.keyword
        
        const pixelSize = Math.max(3, Math.floor(bubble.radius / 12));
        
        const bubbleCanvas = document.createElement('canvas');
        const bubbleCtx = bubbleCanvas.getContext('2d');
        if (bubbleCtx) {
          const canvasSize = bubble.radius * 2.5;
          bubbleCanvas.width = canvasSize;
          bubbleCanvas.height = canvasSize;
          
          // Create pulsating glow effect
          const pulseRate = 0.5 + Math.sin(timestamp / 500) * 0.2;
          const glowSize = bubble.radius * (0.3 + bubble.glowIntensity * pulseRate);
          
          // Draw glow
          bubbleCtx.shadowColor = bubble.glowColor;
          bubbleCtx.shadowBlur = glowSize;
          bubbleCtx.beginPath();
          bubbleCtx.arc(canvasSize/2, canvasSize/2, bubble.radius * 0.9, 0, Math.PI * 2);
          
          // Use direct rgba values instead of string replacements
          const opacity = isHovered ? 0.9 : bubble.opacity;
          bubbleCtx.fillStyle = bubble.color;
          bubbleCtx.fill();
          
          // Add inner highlight
          const gradient = bubbleCtx.createRadialGradient(
            canvasSize/2 - bubble.radius * 0.3, 
            canvasSize/2 - bubble.radius * 0.3, 
            0,
            canvasSize/2,
            canvasSize/2,
            bubble.radius
          );
          
          // Use direct rgba values for gradient
          const glowColorRgba = getColorComponents(bubble.glowColor);
          gradient.addColorStop(0, `rgba(${glowColorRgba.r}, ${glowColorRgba.g}, ${glowColorRgba.b}, 0.6)`);
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          bubbleCtx.fillStyle = gradient;
          bubbleCtx.fill();
          
          // Draw pixelated bubble
          for (let x = 0; x < canvasSize; x += pixelSize) {
            for (let y = 0; y < canvasSize; y += pixelSize) {
              const imageData = bubbleCtx.getImageData(x, y, 1, 1).data;
              
              if (imageData[3] > 10) {
                // Add some random variation to pixels for a more "digital" look
                const brightness = isHovered ? 1.2 : 1.0;
                const r = Math.min(255, imageData[0] * brightness);
                const g = Math.min(255, imageData[1] * brightness);
                const b = Math.min(255, imageData[2] * brightness);
                
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${imageData[3]/255})`;
                ctx.fillRect(
                  Math.floor((bubble.x - canvasSize/2 + x) / pixelSize) * pixelSize, 
                  Math.floor((bubble.y - canvasSize/2 + y) / pixelSize) * pixelSize, 
                  pixelSize, 
                  pixelSize
                );
              }
            }
          }
          
          // Add extra hover effects
          if (isHovered) {
            bubbleCtx.clearRect(0, 0, canvasSize, canvasSize);
            
            // Draw pixelated outer ring
            bubbleCtx.beginPath();
            bubbleCtx.arc(canvasSize/2, canvasSize/2, bubble.radius + pixelSize*2, 0, Math.PI * 2);
            bubbleCtx.strokeStyle = bubble.glowColor;
            bubbleCtx.lineWidth = pixelSize;
            bubbleCtx.stroke();
            
            // Add scanline effect
            for (let y = 0; y < canvasSize; y += pixelSize * 3) {
              bubbleCtx.fillStyle = `rgba(255, 255, 255, 0.2)`;
              bubbleCtx.fillRect(0, y, canvasSize, pixelSize);
            }
            
            for (let x = 0; x < canvasSize; x += pixelSize) {
              for (let y = 0; y < canvasSize; y += pixelSize) {
                const imageData = bubbleCtx.getImageData(x, y, 1, 1).data;
                if (imageData[3] > 10) {
                  ctx.fillStyle = `rgba(${imageData[0]}, ${imageData[1]}, ${imageData[2]}, ${imageData[3]/255})`;
                  ctx.fillRect(
                    Math.floor((bubble.x - canvasSize/2 + x) / pixelSize) * pixelSize, 
                    Math.floor((bubble.y - canvasSize/2 + y) / pixelSize) * pixelSize, 
                    pixelSize, 
                    pixelSize
                  );
                }
              }
            }
          }
        }
        
        // Draw text with cyberpunk style
        const textCanvas = document.createElement('canvas');
        const textCtx = textCanvas.getContext('2d');
        if (textCtx) {
          const textSize = bubble.radius * 2.5;
          textCanvas.width = textSize;
          textCanvas.height = textSize;
          
          // Text glow effect
          textCtx.shadowColor = bubble.glowColor;
          textCtx.shadowBlur = 10;
          textCtx.shadowOffsetX = 0;
          textCtx.shadowOffsetY = 0;
          
          // Draw keyword with cyberpunk style
          textCtx.font = `bold ${Math.min(bubble.radius * 0.5, 18)}px "Courier New", monospace`;
          textCtx.textAlign = 'center';
          textCtx.textBaseline = 'middle';
          textCtx.fillStyle = '#FFFFFF';
          
          // Add scanline effect to text
          const scanLineHeight = Math.max(2, Math.floor(bubble.radius * 0.05));
          for (let y = 0; y < textSize; y += scanLineHeight * 3) {
            textCtx.fillRect(0, y, textSize, scanLineHeight);
          }
          
          // Draw keyword text
          textCtx.fillStyle = isHovered ? bubble.glowColor : '#FFFFFF';
          textCtx.fillText(bubble.keyword.keyword, textSize/2, textSize/2);
          
          // Draw change percentage with appropriate color
          const changeText = `${bubble.keyword.change > 0 ? '+' : ''}${bubble.keyword.change}%`;
          textCtx.fillStyle = bubble.keyword.change >= 0 ? '#00FF00' : '#FF0000';
          textCtx.font = `${Math.min(bubble.radius * 0.3, 14)}px "Courier New", monospace`;
          textCtx.fillText(changeText, textSize/2, textSize/2 + bubble.radius * 0.4);
          
          // Draw the text canvas onto the main canvas
          ctx.drawImage(
            textCanvas, 
            bubble.x - textSize/2, 
            bubble.y - textSize/2, 
            textSize, 
            textSize
          );
        }
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [keywords])

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    mouseRef.current = { x: mouseX, y: mouseY }
    
    let hoveredBubble = null
    for (const bubble of bubblesRef.current) {
      const distance = Math.sqrt(
        Math.pow(mouseX - bubble.x, 2) + Math.pow(mouseY - bubble.y, 2)
      )
      if (distance < bubble.radius) {
        hoveredBubble = bubble
        break
      }
    }

    const newHoveredKeyword = hoveredBubble ? hoveredBubble.keyword.keyword : null;
    if (newHoveredKeyword !== hoveredKeyword) {
      setHoveredKeyword(newHoveredKeyword);
    }
    
    canvas.style.cursor = hoveredBubble ? 'pointer' : 'default'
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (hoveredKeyword) {
      console.log(`点击了关键词: ${hoveredKeyword}`);
      
      // 跳转到交易页面，将关键词作为参数传递
      router.push(`/trade/${encodeURIComponent(hoveredKeyword)}`);
    }
  }

  // Helper function to convert hex color to RGB components
  const getColorComponents = (color: string) => {
    // Default values
    const defaultColor = { r: 255, g: 102, b: 255 };
    
    // Return default if color is invalid
    if (!color || typeof color !== 'string') {
      return defaultColor;
    }
    
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        // #RGB format
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16)
        };
      } else if (hex.length === 6) {
        // #RRGGBB format
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16)
        };
      }
    }
    
    // Return default for any other format
    return defaultColor;
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full"
        aria-label="Trending Keywords Bubbles"
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
      />
    </div>
  )
}
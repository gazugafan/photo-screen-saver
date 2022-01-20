import getPixels from "get-pixels"

// Return a random integer between min (inclusive) and max (exclusive)
export function getRandom(
   min: number,
   max: number)
{
   return Math.floor(Math.random() * (max - min)) + min
}

// Return a random 2 decimal float between min (inclusive) and max (exclusive)
export function getRandomFloat(
   min: number,
   max: number)
{
   return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

// Randomize array element order in-place using Durstenfeld shuffle algorithm
export function shuffle(
   array: Array<any>)
{
   for(let i = array.length - 1; i > 0; i--)
   {
      let j = Math.floor(Math.random() * (i + 1))
      let temp = array[i]
      array[i] = array[j]
      array[j] = temp
   }
}

export function closeWindow()
{
   // We only want to close the window when we're running in Electron, because it's annoying when
   // you're testing in the browser and the window keeps closing. If we're running in the browser
   // (testing in webpack-dev-server, for example) window.api won't be defined. It is only defined
   // when Electron runs the script in preload.ts, and that script calls contextBridge.exposeInMainWorld.
   //if(typeof (window as any).api !== "undefined")
   //   window.close()
}

export function delay(
   timeout: number)
{
   return new Promise<void>(resolve => window.setTimeout(resolve, timeout))
}

/**
 * Attempts to determine if the specified image is a photo (not an obvious graphic design with flat colors)
 * @param path
 */
export function isPhoto(path:string)
{
	return new Promise(function(resolve, reject) {
		getPixels(path, function (err, pixels) {
			if (err)
				reject(err)

			let width = pixels.shape[0]
			let height = pixels.shape[1]
			let boxSize = 0.075
			let boxWidth = Math.floor(width * boxSize)
			let boxHeight = Math.floor(height * boxSize)

			for (let x = 0; x <= width - boxWidth; x += boxWidth)
			{
				for (let y = 0; y <= height - boxHeight; y += boxHeight)
				{
					//start with the upper-left pixel of this small box...
					let r1 = pixels.get(x, y, 0)
					let b1 = pixels.get(x, y, 1)
					let g1 = pixels.get(x, y, 2)
					let isFlat = true

					//compare every other pixel in this box. If one is different enough, skip this box...
					for (let boxX = x; boxX < boxWidth + x; boxX++)
					{
						for (let boxY = y; boxY < boxHeight + y; boxY++)
						{
							let r2 = pixels.get(boxX, boxY, 0)
							let b2 = pixels.get(boxX, boxY, 1)
							let g2 = pixels.get(boxX, boxY, 2)
							let diff = (Math.abs(r2 - r1) + Math.abs(g2 - g1) + Math.abs(b2 - b1))

							if (diff > 4)
							{
								isFlat = false
								break
							}
						}

						if (!isFlat)
							break
					}

					//if this box was completely flat, this probably isn't a photo...
					if (isFlat)
					{
						resolve(false)
						return
					}
				}
			}

			resolve(true)
		})
	})
}

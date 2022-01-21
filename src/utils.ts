import getPixels from "get-pixels"
import { NdArray } from "ndarray"

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
   if(typeof (window as any).api !== "undefined")
      window.close()
}

export function delay(
   timeout: number)
{
   return new Promise<void>(resolve => window.setTimeout(resolve, timeout))
}

/**
 * Counts the number of surrounding pixels that closely match the color at the specified coordinate.
 * Similar to a paint flood fill, but counts the pixels that would be filled.
 *
 * @param pixels The image
 * @param x The X coordinate to start from
 * @param y The Y coordinate to start from
 */
export function countFillPixels(pixels:NdArray<Uint8Array>, x:number, y:number):number
{
	interface Pixel {
		x: number
		y: number
	}

	//if this pixel has already been counted, or if the coordinate is out of bounds, abort...
	if (x < 0 || x >= pixels.shape[0] || y < 0 || y >= pixels.shape[1] || pixels.get(x, y, 3) === 1)
		return 0

	let originalColor = {r:pixels.get(x, y, 0), g:pixels.get(x, y, 1), b:pixels.get(x, y, 2)}
	let queue:Array<Pixel> = [{x, y}]
	let count = 0
	let diff = 0
	while(queue.length > 0)
	{
		let pixel = queue.pop()

		//if this pixel has already been counted, or if the coordinate is out of bounds, skip it...
		if (pixel === undefined || pixel.x < 0 || pixel.x >= pixels.shape[0] || pixel.y < 0 || pixel.y >= pixels.shape[1] || pixels.get(pixel.x, pixel.y, 3) === 1)
			continue

		//check to see if this pixel is close enough to the original color, count it and check the surrounding pixels...
		diff = Math.abs(pixels.get(pixel.x, pixel.y, 0) - originalColor.r) + Math.abs(pixels.get(pixel.x, pixel.y, 1) - originalColor.g) + Math.abs(pixels.get(pixel.x, pixel.y, 2) - originalColor.b)
		if (diff < 4)
		{
			pixels.set(pixel.x, pixel.y, 3, 1)
			count++

			if (count > 500)
			{
				pixels.set(pixel.x, pixel.y, 3, 1)
			}

			queue.push({x: pixel.x - 1, y: pixel.y})
			queue.push({x: pixel.x + 1, y: pixel.y})
			queue.push({x: pixel.x, y: pixel.y - 1})
			queue.push({x: pixel.x, y: pixel.y + 1})
		}
	}

	return count
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
			let stepX = Math.ceil(width * 0.005)
			let stepY = Math.ceil(height * 0.005)
			//console.log("path", path)
			let maxFillCount = 0
			let curFillCount = 0
			for (let x = 0; x <= width; x += stepX)
			{
				for (let y = 0; y <= height; y += stepY)
				{
					curFillCount = countFillPixels(pixels, x, y)
					if (curFillCount > maxFillCount)
					{
						//console.log("new max at", [x, y, curFillCount])
						maxFillCount = curFillCount
					}
				}
			}

			//console.log("isPhoto", path)
			//console.log("maxFillCount", maxFillCount)

			//if the largest fill area is too much of the image, this probably isn't a photo...
			let totalSize = width * height
			let sizeCutoff = totalSize * 0.025
			//console.log("sizeCutoff", sizeCutoff)
			if (maxFillCount > sizeCutoff)
			{
				//console.log("NOT A PHOTO")
				resolve(false)
			}
			else
				resolve(true)
		})
	})
}

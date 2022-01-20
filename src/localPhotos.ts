import { Photo } from "./photo"
import {isPhoto, shuffle} from "./utils"

export async function getLocalPhotos(): Promise<Photo[]>
{
   const api = (window as any).api

   // If we're running in the browser (testing in webpack-dev-server, for example) window.api won't
   // be defined. It is only defined when Electron runs the script in preload.ts, and that script
   // calls contextBridge.exposeInMainWorld.
   if(typeof api === "undefined")
      throw new Error("The localPhotos module only works when running in Electron.")

   const photos = api.getLocalPhotos()
	shuffle(photos)

	for(let currentPhotoID = 0; currentPhotoID < photos.length; currentPhotoID++)
	{
		if (await isPhoto(photos[currentPhotoID].url))
		{
			photos[currentPhotoID].isPhoto = true
			break
		}
		else
		{
			photos[currentPhotoID].isPhoto = false
		}
	}

   return Promise.resolve(photos)
}

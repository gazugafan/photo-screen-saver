import { contextBridge } from "electron"
import { LOCAL_FOLDER_PATH } from "./constants"
import { Photo } from "./photo"
import { glob } from "glob"

contextBridge.exposeInMainWorld("api", { getLocalPhotos })

function getLocalPhotos(): Photo[]
{
	let folderPath = LOCAL_FOLDER_PATH
	if(!folderPath.endsWith("/"))
		folderPath += "/"

	const fileNames = glob.sync("**/*.jp?(e)g", {cwd:folderPath})

	const photos = fileNames
	.map(fn => ({
		url: `file:///${folderPath}${fn}`,
		title: "",
		attribution: "",
	}))

	return photos
}

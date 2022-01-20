import { contextBridge } from "electron"
import { LOCAL_FOLDER_PATH } from "./constants"
import { Photo } from "./photo"
import fs from "fs"
import path from "path"

contextBridge.exposeInMainWorld("api", { getLocalPhotos })

function readdir_recursive(dir:string, filelist:Array<string> = []):Array<string>
{
	let files = fs.readdirSync(dir)

	files.forEach(function(file) {
		if (fs.statSync(path.join(dir, file)).isDirectory())
		{
			filelist = readdir_recursive(path.join(dir, file), filelist)
		}
		else
		{
			filelist.push(path.join(dir, file))
		}
	})

	return filelist
}

function getLocalPhotos(): Photo[]
{
	let folderPath = LOCAL_FOLDER_PATH
	if(!folderPath.endsWith("/"))
		folderPath += "/"

	const fileNames = readdir_recursive(folderPath)

	const photos = fileNames
	.filter(fn => fn.match(/\.(jpg|jpeg)$/i) != null)
	.map(fn => ({
		url: `file:///${fn}`,
		title: "",
		attribution: "",
		isPhoto: undefined
	}))

	return photos
}

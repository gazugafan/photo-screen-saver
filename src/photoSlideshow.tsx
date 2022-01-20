import { useEffect, useReducer } from "react"
import { Transition, TransitionGroup } from "react-transition-group"
import classNames from "classnames"
import {closeWindow, delay, getRandom, getRandomFloat, isPhoto } from "./utils"
import { Photo } from "./photo"
import { getFlickrPhotos } from "./flickrPhotos"
import { getLocalPhotos } from "./localPhotos"
import styles from "./photoSlideshow.module.scss"

// Choose the source for the photos you want to display:
type GetPhotosFn = typeof getFlickrPhotos | typeof getLocalPhotos
const GET_PHOTOS: GetPhotosFn = getLocalPhotos

// Keep these in sync with photoSlideshow.module.scss:
const PHOTO_INTERVAL = 5
const FADE_IN_DURATION = 1

const SECONDS = 1000

export function PhotoSlideshow()
{
   const [state, dispatch] = useReducer(reducer, initialState)

   useEffect(() =>
   {
      async function load()
      {
         try
         {
            const photos = await GET_PHOTOS()

            if(photos.length === 0)
               throw new Error("No photos found that meet criteria.")

            console.log(`${photos.length} photos found that meet criteria`)

            dispatch({ type: "load", photos })
         }
         catch(err: any)
         {
            window.alert(err.toString())
            closeWindow()
         }
      }

      load()
   },
   [])

   useEffect(() =>
   {
      if(state.photos.length > 0)
      {
         const interval = window.setInterval(() => dispatch({ type: "next" }), PHOTO_INTERVAL * SECONDS)
         return () => window.clearInterval(interval)
      }
   },
   [state.photos])

   useEffect(() =>
   {
      if(state.photoIdx >= 0)
         console.log(`photo ${state.photoIdx}: ${state.photos[state.photoIdx].url}`)
   },
   [state.photos, state.photoIdx])

   async function onImageLoad()
   {
      // If we dispatch the imageload action too quickly, the visible style will be added to the
      // photo div too quickly and the browser won't run its animations. This delay is enough to
      // solve the problem.
      await delay(100)

      dispatch({ type: "imageload" })
	   findNextPhoto()
   }

	/**
	 * Looks for the next image that is a photo
	 */
	async function findNextPhoto()
   {
	   //find the next image that is a photo...
	   let currentPhotoID = state.photoIdx
	   while(true)
	   {
		   currentPhotoID++
		   if (currentPhotoID >= state.photos.length)
			   currentPhotoID = 0

		   //if we've looped all the way through, then we have nothing more to do...
		   if (currentPhotoID === state.photoIdx)
			   return

		   //if we haven't inspected this image yet...
		   if (state.photos[currentPhotoID].isPhoto === undefined)
		   {
			   if (await isPhoto(state.photos[currentPhotoID].url))
			   {
				   dispatch({ type: "updatephoto", id:currentPhotoID, isPhoto:true })
				   return
			   }
			   else
			   {
				   dispatch({ type: "updatephoto", id:currentPhotoID, isPhoto:false })
			   }
		   }
	   }
   }

   return (
      <div className={styles.root}>
         {state.photoIdx >= 0 &&
            <TransitionGroup>
               <Transition key={state.photoIdx} timeout={(FADE_IN_DURATION + 1) * SECONDS} appear={true}>
                  <>
                     <div
                        className={classNames(styles.photo, { [styles.visible]: state.isImageLoaded })}
                        style={{ zIndex: state.zIndex }}
                     >
                        <img
							className={styles.photoBackground}
                           src={state.photos[state.photoIdx].url}
                           alt=""
                           onError={e => dispatch({ type: "next" })}
                        />
                        <div
							className={styles.photoForeground}
							style={{transform: `scale(${state.scale}) rotate(${state.rotation}deg)`, transformOrigin: `${state.origin.x}% ${state.origin.y}%`}}
                        >
							<img
								src={state.photos[state.photoIdx].url}
								alt=""
								onLoad={onImageLoad}
								onError={e => dispatch({ type: "next" })}
							/>
						</div>
                     </div>
                     <label
                        className={classNames(styles[`pos${state.photoIdx % 4}`], { [styles.visible]: state.isImageLoaded })}
                        style={{ zIndex: state.zIndex }}
                     >
                        {getCaption(state.photos[state.photoIdx])}
                     </label>
                  </>
               </Transition>
            </TransitionGroup>
         }
      </div>
   )
}

interface State
{
   photos: Photo[],
   photoIdx: number,
   zIndex: number,
   origin: { x: number, y: number },
   scale: number,
   rotation: number,
   isImageLoaded: boolean,
}

const initialState: State =
{
   photos: [],
   photoIdx: -1,
   zIndex: 0,
   origin: { x: 0, y: 0 },
   scale: 1,
   rotation: 0,
   isImageLoaded: false,
}

interface ActionLoad
{
   type: "load",
   photos: Photo[],
}

interface ActionNext
{
   type: "next"
}

interface ActionImageLoad
{
   type: "imageload"
}

interface ActionUpdatePhoto
{
   type: "updatephoto",
	id:number,
	isPhoto:boolean
}

type Action = ActionLoad | ActionNext | ActionImageLoad | ActionUpdatePhoto

function reducer(
   state: State,
   action: Action)
: State
{
	let currentPhotoID = -1

   switch(action.type)
   {
	   case "updatephoto":
		   return {
			   ...state,
			   photos: state.photos.map(
				   (photo, i) => i === action.id ?
					   {...photo, isPhoto: action.isPhoto}
					   :photo
			   )
		   }

      case "load":
		  //find the first image that is a photo...
		  while(currentPhotoID < action.photos.length - 1)
		  {
			  currentPhotoID++
			  if (action.photos[currentPhotoID].isPhoto)
				  break
		  }

         return {
            photos: action.photos,
            photoIdx: currentPhotoID,
            zIndex: 1,
            origin: getRandomOrigin(),
            scale: getRandomScale(),
            rotation: getRandomRotation(),
            isImageLoaded: false
         }

      case "next":
		  //find the next image that is a photo...
		  let previousPhotoID = state.photoIdx
		  currentPhotoID = state.photoIdx
		  while(true)
		  {
			  currentPhotoID++
			  if (currentPhotoID >= state.photos.length)
				  currentPhotoID = 0

			  //if we've looped all the way through, then we have no photos so just display the next image...
			  if (currentPhotoID === previousPhotoID)
			  {
				  currentPhotoID++
				  if (currentPhotoID >= state.photos.length)
					  currentPhotoID = 0
				  break
			  }

			  if (state.photos[currentPhotoID].isPhoto)
				  break
		  }

         return {
            ...state,
            photoIdx: currentPhotoID,
            zIndex: state.zIndex + 1,
            origin: getRandomOrigin(),
            scale: getRandomScale(),
			 rotation: getRandomRotation(),
            isImageLoaded: false,
         }

      case "imageload":
         return { ...state, isImageLoaded: true, scale: getRandomScale(), rotation: getRandomRotation() }
   }
}

function getRandomOrigin()
{
   return { x: getRandom(0, 100), y: getRandom(0, 100) }
}

function getRandomScale()
{
   return getRandomFloat(0.8, 1.2)
}

function getRandomRotation()
{
   return getRandomFloat(-3, 3)
}

function getCaption(
   photo: Photo)
{
   if(photo.title || photo.attribution)
      return `${photo.title || "(Untitled)"} ${photo.attribution}`

   return ""
}

import React, { useState, useEffect, useContext, useRef } from 'react'
import {
  Route,
  Switch,
  useHistory,
  useLocation,
  useParams
} from 'react-router-dom'
import {
  Button,
  RadioGroup,
  Radio,
  FormControlLabel,
  Dialog,
  DialogTitle,
  Snackbar,
  Alert,
  Container,
  CircularProgress
} from '@mui/material'
import axios from 'axios'
import { authContext } from '../App'
import AdForm from '../ReactModels/Ad/AdForm'
import AdsTable from '../ReactModels/Ad/AdsTable'
import Carousel from '../Carousel'

const GENDERS = [
  'Male',
  'Female',
  'Transgender',
  'Gender neutral',
  'Non-binary',
  'Agender',
  'Pangender',
  'Genderqueer',
  'Two-spirit',
  'Third gender'
]
const BODY_PARTS = [
  'Torso and Legs',
  'Head',
  'Eyes',
  'Ears',
  'Neck',
  'Torso',
  'hands',
  'Waist',
  'Legs',
  'Feet'
]
const TYPES = [
  'Sweater',
  'Dress',
  'Hoodies',
  'T-shirt',
  'Flip-flops',
  'Shorts',
  'Pants',
  'Skirt',
  'Jeans',
  'Shoes',
  'Coat',
  'High heels',
  'Suit',
  'Cap',
  'Socks',
  'Shirt',
  'Bra',
  'Scarf',
  'Swimsuit',
  'Hat',
  'Gloves',
  'Jacket',
  'Long coat',
  'Boots',
  'Sunglasses',
  'Tie',
  'Polo shirt',
  'Leather jackets'
]

/**
 * Decides what to render: collection or single (like in routes in server :)
 * @description manager of a model (collection and element).
 * @returns \<switch> of collection and element components.
 */
const AdManager = () => {
  //    React router hooks and authentication context value
  const history = useHistory()
  const location = useLocation()
  console.log(`AdManager at ${location.pathname}.`)
  const { id } = useParams()
  const { authUser } = useContext(authContext)

  //    States
  //    Collection
  const initialAds = []
  const [ads, setAds] = useState(initialAds)
  //    Single
  const isEmpty = false // debug.
  const initialAd = {
    id: '',
    photo: '/default.png',
    gender: isEmpty ? '' : 'Male',
    bodyPart: isEmpty ? '' : 'Torso and Legs',
    type: isEmpty ? '' : 'Sweater',
    title: isEmpty ? '' : 'asdf1',
    description: isEmpty ? '' : 'asdf desc1',
    isGiven: false,
    UserId: ''
  }
  const [ad, setAd] = useState(initialAd)
  const initialAdRef = useRef(initialAd)
  // newUserForm Dialog
  const [isAdFormOpen, setAdFormOpen] = useState(false)
  // Feedback related
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false)
  const [sbAlert, setSbAlert] = useState({ text: '', severity: 'error' }) // sb - snackbar
  // Progress circle.
  const [waiting, setWaiting] = useState(false) // for ads or ad
  const [waitingPhoto, setWaitingPhoto] = useState(false)
  const [waitingPhotoDestroy, setWaitingPhotoDestroy] = useState(false)
  const [waitingSubmit, setWaitingSubmit] = useState(false)
  const [waitingDestroy, setWaitingDestroy] = useState(false)

  //    Create and update
  // Create - Dialog related and then submit
  const handleAdFormOpen = () => {
    setAdFormOpen(true)
  }
  const handleAdFormClose = () => {
    setAdFormOpen(false)
    console.log('in handleAdFormClose');
    if (ad.photo !== '/default.png') {
      const key = new URL(ad.photo).pathname
      handlePhotoDestroy(key)
    }
    // Changing ad back to what it was (TODO: might save it before overwriting it with new ad).
    if (id)
      if (ads.length)
        // TODO: might want to use only get like bezcoder did (since it's supposed to pass on the retrieval).
        // If ads in memory than we search it.
        setAd(ads[ads.findIndex(ad => id === ad.id.toString())])
      // We get the ad from the server.
      else
        axios
          .get(`/api/ads/${id}`)
          .then(({ data }) => {
            setAd(data)
          })
          .catch(error =>
            handleSnackbarOpen(
              error.response?.statusText || error.message,
              'error'
            )
          )
  }
  // Submit form on create and update.
  const handleSubmit = (path, method) => {
    setWaitingSubmit(true)
    axios({
      method,
      url: path,
      headers: { 'content-type': 'application/json' },
      data: ad
    })
      .then(({ data }) => {
        // Alert that the action was performed successfully.
        const pastTenses = {
          post: 'Created',
          put: 'Updated',
          delete: 'Deleted'
        }
        console.log(`${ad.title} was ${pastTenses[method]}!`)

        if (method === 'post') {
          setAdFormOpen(false)
          // in AdsTable/Carousel.
          if (!id) setAds(prevAds => prevAds.concat(data))
          handleSnackbarOpen(`Ad ${ad.title} created!`, 'success')
        } else if (method === 'put') {
          // id present anyways.
          handleSnackbarOpen(`Ad ${id} updated!`, 'success')
          // ads in memory.
          if (ads.length !== 0) history.push('/ads')
        }
        setWaitingSubmit(false)
      })
      .catch(error => {
        handleSnackbarOpen(error.response?.statusText || error.message, 'error')
      })
      .finally(() => setAd(initialAd))
  }
  //    Read
  // URL changed.
  useEffect(() => {
    const initialAd = initialAdRef.current
    setWaiting(true)
    // /ads
    if (!id) {
      // Read ads
      axios
        .get('/api/ads')
        .then(({ data }) => {
          setAds(data)
          setWaiting(false)
        })
        .catch(error =>
          handleSnackbarOpen(
            error.response?.statusText || error.message,
            'error'
          )
        )
      setAd(initialAd) // might navigated from a deleted or existing element.
    }
    // /ad
    // Read ad
    else
      axios
        .get(`/api/ads/${id}`)
        .then(({ data }) => {
          setAd(data)
          setWaiting(false)
        })
        .catch(error =>
          handleSnackbarOpen(
            error.response?.statusText || error.message,
            'error'
          )
        )
  }, [id])
  //    Destroy
  const handleDestroy = indices => {
    setWaitingDestroy(true)
    // /ads. indices present.
    if (!id) destroyAds()
    // /ads/:id
    else {
      destroyAd()
      setAd(initialAd)
    }

    function destroyAds() {
      // TODO: might want to save server requests by sending all ids in action or body.
      Promise.all(
        indices.map(index => axios.delete(`/api/ads/${ads[index].id}`))
      )
        .then(() => {
          // Deleting selected ads from ads.
          setAds(prevAds => {
            indices.sort() // Must sort because we're using pop.
            while (indices.length) {
              prevAds.splice(indices.pop(), 1)
            }
            return prevAds.slice()
          })
          handleSnackbarOpen('Ad(s) destroyed!', 'success')
          setWaitingDestroy(false)
        })
        .catch(error =>
          handleSnackbarOpen(
            error.response?.statusText || error.message,
            'error'
          )
        )
    }

    function destroyAd() {
      axios
        .delete(`/api/ads/${id}`)
        .then(() => {
          setWaitingDestroy(false)
          // ads in memory
          if (ads.length) history.replace('/ads')
          handleSnackbarOpen('Ad destroyed!', 'success')
        })
        .catch(error =>
          handleSnackbarOpen(
            error.response?.statusText || error.message,
            'error'
          )
        )
    }
  }

  //    Standard form change handler
  const handleChange = (name, value) => {
    setAd(prevAd => ({ ...prevAd, [name]: value }))
    // TODO: how can I change the collection simoultaniously?.
  }
  //    Photo change and destroy handlers
  const handlePhotoChange = async file => {
    setWaitingPhoto(true)
    try {
      // Get the signed URL to upload the photo to.
      const response = await axios.post('/api/adsPhotos', {
        params: { 'file-name': file.name, 'file-type': file.type }
      })
      // Upload the photo to the signed URL.
      await axios.put(response.data.signedURL, file)
      // Change the, now hidden, photo field programmatically.
      setAd(prevAd => ({ ...prevAd, photo: response.data.photo }))
      setWaitingPhoto(false)
    } catch (error) {
      console.log('Fetch of signed request or PUTing the photo failed!', error)
    }
  }
  const handlePhotoDestroy = async key => {
    setWaitingPhotoDestroy(true)
    // extract photo key (name) from photo URL and destroy it.
    try {
      await axios.delete(`/api/adsPhotos/${key}`)
      setAd(prevAd => ({ ...prevAd, photo: '/default.png' }))
      setWaitingPhotoDestroy(false)
    } catch (error) {
      // TODO: need to extract to manager parent because snackbar needed.
      alert(
        'Destruction of photo unsuccessfull! Go to aws console and delete the photo yourself.'
      )
    }
  }

  //    Feedback
  function handleSnackbarOpen(text, severity) {
    setIsSnackbarOpen(true)
    setSbAlert({ text, severity })
    console.log(`${severity}: ${text}`)
  }
  function handleSnackbarClose(event, reason) {
    if (reason === 'clickaway') {
      return
    }
    setIsSnackbarOpen(false)
  }

  // Helpers
  const handleGenerate = () => {
    const gender = GENDERS[Math.floor(Math.random() * GENDERS.length)]
    const bodyPart = BODY_PARTS[Math.floor(Math.random() * BODY_PARTS.length)]
    const type = TYPES[Math.floor(Math.random() * TYPES.length)]
    const title = ad.title.slice(0, -1) + (+ad.title.slice(-1) + 1)
    const description =
      ad.description.slice(0, -1) + (+ad.description.slice(-1) + 1)
    setAd({ ...ad, gender, bodyPart, type, title, description })
  }
  // upated/deleted from an independant page.
  if (sbAlert.text.includes('delete')) return <div>{sbAlert.text}</div>
  return (
    <>
      <Switch>
        <Route exact path="/ads">
          {waiting ? (
            <Container sx={{ width: '150px', paddingTop: '100px' }}>
              <CircularProgress size={100} />
            </Container>
          ) : (
            <AdsTable
              initialElement={initialAd}
              rows={ads}
              onDestroy={handleDestroy}
              onPhotoDestroy={handlePhotoDestroy}
              waitingDestroy={waitingDestroy}
            />
          )}
        </Route>
        <Route path="/ads/:id">
          {waiting ? (
            <Container sx={{ width: '150px', paddingTop: '100px' }}>
              <CircularProgress size={100} />
            </Container>
          ) : (
            <AdForm
              name="existing"
              ad={ad}
              onSubmit={handleSubmit}
              onChange={handleChange}
              onDestroy={handleDestroy}
              onPhotoChange={handlePhotoChange}
              onPhotoDestroy={handlePhotoDestroy}
              waitingPhoto={waitingPhoto}
              waitingPhotoDestroy={waitingPhotoDestroy}
              waitingSubmit={waitingSubmit}
              waitingDestroy={waitingDestroy}
            />
          )}
        </Route>
        <Route path="/adsCarousel">
          <Carousel value={ads} />
        </Route>
      </Switch>
      {/* Create button */}
      {authUser && (
        <Button variant="contained" onClick={handleAdFormOpen}>
          Create a New ad
        </Button>
      )}
      {/* Create dialog form */}
      <Dialog
        open={isAdFormOpen}
        onClose={handleAdFormClose}
        scroll="body"
        PaperProps={{ sx: { padding: '0px 10px 10px' } }}
      >
        <DialogTitle sx={{ fontSize: '1rem', padding: '8px 24px' }}>
          Create a new Ad
          <Button variant="outlined" size="small" onClick={handleGenerate}>
            Generate random fields!
          </Button>
        </DialogTitle>
        <AdForm
          name="new"
          ad={ad}
          onSubmit={handleSubmit}
          onChange={handleChange}
          onPhotoChange={handlePhotoChange}
          onPhotoDestroy={handlePhotoDestroy}
          waitingPhoto={waitingPhoto}
          waitingPhotoDestroy={waitingPhotoDestroy}
          waitingSubmit={waitingSubmit}
        />
      </Dialog>
      {/* Feedback snackbar */}
      <Snackbar
        open={isSnackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={sbAlert.severity}
          variant="filled"
        >
          {sbAlert.text}
        </Alert>
      </Snackbar>
    </>
  )
}

export default AdManager

export const AdSwitch = () => {
  const history = useHistory()
  const location = useLocation()

  // Radio Group
  const [selectedPage, setSelectedPage] = useState('')

  // Switch between table and carousel.
  const handlePageChange = event => {
    const selectedPage = event.target.value
    // replace if table or carousel, else push.
    if (location.pathname === '/ads' || location.pathname === '/adsCarousel')
      history.replace(selectedPage)
    else history.push(selectedPage)
  }
  // On navigation, change selected radio.
  useEffect(() => {
    setSelectedPage(location.pathname)
  }, [location.pathname])

  return (
    <div>
      <RadioGroup
        name="ads-page-switcher"
        value={selectedPage} // from path.
        onChange={handlePageChange}
        row
      >
        <FormControlLabel value="/ads" control={<Radio />} label="Table" />
        <FormControlLabel
          value="/adsCarousel"
          control={<Radio />}
          label="Carousel"
        />
      </RadioGroup>
    </div>
  )
}

//    TODOs
// * think about merging to one component with 'value' prop that will be a single element or a collection according to whether the use is loggeding.
// * when presenting the ads, then login and then again getting the ads instead of saving them in memory, think about a way to access them globally (maybe redux?).
// * when updating an ad and then navigating through the radio buttun to table, and than to the ad, it doesn't update on client.
// A comment for github

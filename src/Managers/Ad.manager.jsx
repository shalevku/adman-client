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
  Alert
} from '@mui/material'
import dataService from '../services/Data.service'
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
  //    React router hooks
  const history = useHistory()
  const location = useLocation()
  console.log(`AdManager at ${location.pathname}.`)
  const { id } = useParams()
  //    Authentication context value
  const { authUser } = useContext(authContext)

  //    States
  //    Collection
  const initialAds = []
  const [ads, setAds] = useState(initialAds)
  //    Single
  const isEmpty = false // debug.
  const initialAd = {
    id: '',
    gender: isEmpty ? '' : 'Male',
    bodyPart: isEmpty ? '' : 'Torso and Legs',
    type: isEmpty ? '' : 'Sweater',
    title: isEmpty ? '' : 'asdf1',
    description: isEmpty ? '' : 'asdf desc1',
    isGiven: false,
    photoName: '',
    UserId: ''
  }
  const [ad, setAd] = useState(initialAd)
  const initialAdRef = useRef(initialAd)
  // newUserForm Dialog
  const [isAdFormOpen, setAdFormOpen] = useState(false)
  // Feedback related
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false)
  const [sbAlert, setSbAlert] = useState({ text: '', severity: 'error' }) // sb - snackbar

  //    Create and update
  // Create
  const handleAdFormOpen = () => {
    setAdFormOpen(true)
  }
  const handleAdFormClose = () => {
    setAdFormOpen(false)
    if (id)
      if (ads.length) setAd(ads[ads.findIndex(ad => id === ad.id.toString())])
      else
        dataService(`/api/ads/${id}`, 'get')
          .then(({ data }) => {
            setAd(data)
          })
          .catch(error =>
            handleSnackbarOpen(error.response.statusText, 'error')
          )
  }
  // Submit form on create and update.
  const handleSubmit = (action, method) => {
    const adToSend = { ...ad } // TODO: maybe delete and send directly? (like in components).
    dataService(action, method, adToSend)
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
          // ads in memory.
          if (ads.length !== 0) {
            handleSnackbarOpen(
              `Ad ${id} updated! Redirecting in 6 seconds to table...`,
              'success'
            )
            setTimeout(() => {
              history.push('/ads')
            }, 6000)
          } else handleSnackbarOpen(`Ad ${id} updated!`, 'success')
        }
      })
      .catch(error => {
        handleSnackbarOpen(error.response.statusText, 'error')
      })
  }
  //    Read
  // URL changed.
  useEffect(() => {
    const initialAd = initialAdRef.current
    // /api/ads
    if (!id) {
      // Read ads
      dataService('/api/ads', 'get')
        .then(({ data }) => {
          setAds(data)
        })
        .catch(error => handleSnackbarOpen(error.response.statusText, 'error'))
      setAd(initialAd) // might navigated from a deleted or existing element.
    }
    // /ad
    // Read ad
    else
      dataService(`/api/ads/${id}`, 'get')
        .then(({ data }) => {
          setAd(data)
        })
        .catch(error => handleSnackbarOpen(error.response.text, 'error'))
  }, [id])
  //    Destroy
  const handleDestroy = indices => {
    // /api/ads. indices present.
    if (!id) destroyAds()
    // /ad
    else {
      destroyAd()
      setAd(initialAd)
    }

    function destroyAds() {
      // TODO: might want to save server requests by sending all ids in action or body.
      while (indices.length) {
        const index = indices.pop()

        dataService(`/api/ads/${ads[index].id}`, 'delete')
          .then(() => {
            // TODO: Might want to do them all after while loop.
            setAds(prevAds => {
              prevAds.splice(index, 1)
              return prevAds.slice()
            })
            handleSnackbarOpen('Ad(s) destroyed!', 'success')
          })
          .catch(error =>
            handleSnackbarOpen(error.response.statusText, 'error')
          )
      }
    }

    function destroyAd() {
      dataService(`/api/ads/${id}`, 'delete')
        .then(() => {
          // form is directly navigated.
          if (!ads.length) {
            setAd(initialAd)
            handleSnackbarOpen({
              text: `Ad ${id} deleted!`,
              severity: 'success'
            })
          } else history.replace('/ads')
          handleSnackbarOpen('Ad destroyed!', 'success')
        })
        .catch(error => handleSnackbarOpen(error.response.statusText, 'error'))
    }
  }

  //    Standard form change handler
  const handleChange = (name, value) => {
    setAd(ad => ({ ...ad, [name]: value }))
    // TODO: how can I change the collection simoultaniously?.
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
    const bodyPart = BODY_PARTS[Math.round(Math.random() * BODY_PARTS.length)]
    const type = TYPES[Math.round(Math.random() * TYPES.length)]
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
          <AdsTable
            initialElement={initialAd}
            rows={ads}
            onDestroy={handleDestroy}
          />
        </Route>
        <Route path="/ads/:id">
          <AdForm
            name="existing"
            ad={ad}
            onSubmit={handleSubmit}
            onChange={handleChange}
            onDestroy={handleDestroy}
          />
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

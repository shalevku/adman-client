// One primary advantage is that on navigation to the same component, some controls don't need to re-render.
// I decided to use the native form and submit button attributes, using a single handleSubmit event handler instead onclick events.
import React, { useContext, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import {
  Box,
  Container,
  Stack,
  TextField,
  Button,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  CircularProgress
} from '@mui/material'
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto'
import { authContext } from '../../App'

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
 * <model>Form component represents a form whos action, method and filtered controls are decided according to the name prop.
 * @param {*} props name, ad, onSubmit, onChange, onDestroy, waiting, waitingPhoto.
 * @summary
 * name: form to be rendered (rendered with filtered fields and buttons).
 * ad: ad from parent.
 * onChange: Invoked when one of the form
 * onPhotoChange:
 * @returns \<form> of existing or new ad.
 */
const AdForm = props => {
  //    React router hooks and authentication context value
  console.log(`${props.name}AdForm at ${useLocation().pathname}.`)
  const params = useParams()
  const { authUser } = useContext(authContext)

  //    Setting the action, method and adMask of the form.
  let [action, method] = ['', '']
  // A mask of boolean properties.
  const adMask = {
    id: false,
    gender: false,
    bodyPart: false,
    type: false,
    title: false,
    description: false,
    isGiven: false,
    photo: false,
    update: false,
    destroy: false,
    create: false
  }
  // Fields (properties) of the form that will be rendered.
  switch (props.name) {
    case 'existing':
      ;[action, method] = [`/api/ads/${params.id}`, 'put']
      Object.assign(adMask, {
        id: true,
        gender: true,
        bodyPart: true,
        type: true,
        title: true,
        description: true,
        isGiven: true,
        photo: true,
        update: authUser ? true : false,
        destroy: authUser ? true : false
      })
      break
    case 'new':
      ;[action, method] = [`/api/ads`, 'post']
      Object.assign(adMask, {
        gender: true,
        bodyPart: true,
        type: true,
        title: true,
        description: true,
        photo: true,
        create: authUser ? true : false
      })
      break
    default:
      break
  }

  //    Default behaviors of the form.
  const handleSubmit = event => {
    event.preventDefault()
    const action = new URL(event.target.action).pathname
    props.onSubmit(action, method) // and not event.target.method since only get and post values can be set.
  }
  const handleDestroy = () => {
    // If the ad has a photo than destroy the photo.
    if (props.ad.photo !== '/default.png') {
      const key = new URL(props.ad.photo).pathname
      props.onPhotoDestroy(key)
    }
    // Destroy the ad.
    props.onDestroy()
  }
  const handleTextFieldChange = event => {
    props.onChange(event.target.name, event.target.value)
  }
  const handleCheckboxChange = event => {
    props.onChange(event.target.name, event.target.checked)
  }
  // Autocomplete related:
  // On first render only the input change event fires with null event and empty adAcInputs properties.
  // On autocomplete option check it firstly fires input change event (with click event) and then the autocomplete (listbox click) event, also with click event.
  // Autocomplete Click event - option selected from the listbox.
  const handleAcChange = (event, newValue) => {
    // Extract name of the textbox (via id of the li element).
    const id = event.target.id
    const name = id.substring(0, id.indexOf('-'))
    props.onChange(name, newValue)
  }
  // For controlled inputs from the form itself.
  const [adAcInputs, setAdAcInputs] = useState({
    gender: '',
    bodyPart: '',
    type: ''
  })
  // TODO: On first render the event is null, so I can't get the form field name (maybe only with anonymous function but then I re-render the field on each update which is counter productive a bit).
  // Change event - gender value typed in the textbox.
  const handleGenderInputChange = (event, newInputValue) => {
    setAdAcInputs(adAcInputs => ({ ...adAcInputs, gender: newInputValue }))
  }
  // Change event - bodyPart value typed in the textbox.
  const handleBodyPartInputChange = (event, newInputValue) => {
    setAdAcInputs(adAcInputs => ({ ...adAcInputs, bodyPart: newInputValue }))
  }
  // Change event - type value typed in the textbox.
  const handleTypeInputChange = (event, newInputValue) => {
    setAdAcInputs(adAcInputs => ({ ...adAcInputs, type: newInputValue }))
  }
  //    Photos UD - TODO: think about moving the server communication to the parent manager.
  // Upload photo to signed URL retrieved from server.
  function handlePhotoChange(event) {
    // If the ad has a photo than destroy the photo.
    if (props.name === 'existing' && props.ad.photo !== '/default.png') {
      handlePhotoDestroy()
    }
    // Upload the new photo
    const file = event.target.files[0]
    props.onPhotoChange(file)
  }
  function handlePhotoDestroy() {
    const key = new URL(props.ad.photo).pathname
    props.onPhotoDestroy(key)
  }
  console.log(props.ad.photo);
  // helper state
  return (
    <>
      <Container
        component="form"
        name={props.name}
        action={action}
        method={method} // browser will swap it with get, but in handleSubmit I will change it back to method.
        onSubmit={handleSubmit}
        sx={{
          width: '350px'
        }}
      >
        <Stack
          direction="column"
          spacing={3}
          alignItems="center"
          sx={{
            '& .MuiAutocomplete-root': { width: '200px' }
          }}
        >
          {adMask.photo && (
            <Box>
              <Button
                variant="contained"
                component="label"
                startIcon={<AddAPhotoIcon />}
              >
                <input type="hidden" name="photo" value={props.ad.photo} />
                <input
                  type="file"
                  id="photo-file"
                  onChange={handlePhotoChange}
                  disabled={!authUser}
                  accept="image/*"
                  hidden
                />
                <Box>
                  {props.waitingPhoto ? (
                    <CircularProgress color="secondary" size={100} />
                  ) : (
                    <img
                      id="preview"
                      src={props.ad.photo}
                      alt="preview"
                      style={{
                        width: '150px',
                        height: '100px',
                        objectFit: 'scale-down'
                      }}
                    />
                  )}
                </Box>
              </Button>
              <Box sx={{ width: '150px', margin: 'auto' }}>
                {props.ad.photo !== '/default.png' &&
                  (props.waitingPhotoDestroy ? (
                    <CircularProgress />
                  ) : (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handlePhotoDestroy}
                      sx={{}}
                    >
                      Destroy photo
                    </Button>
                  ))}
              </Box>
            </Box>
          )}
          {adMask.id && (
            <TextField
              id="id"
              label="ID"
              name="id"
              value={props.ad.id}
              onChange={handleTextFieldChange}
              disabled
              sx={{ width: '10ch' }}
            />
          )}
          {adMask.gender && (
            <Autocomplete
              freeSolo
              id="gender"
              value={props.ad.gender}
              onChange={handleAcChange}
              inputValue={adAcInputs.gender}
              onInputChange={handleGenderInputChange}
              options={GENDERS}
              disabled={!authUser}
              renderInput={params => (
                <TextField {...params} name="gender" label="Gender" />
              )}
            />
          )}
          {adMask.bodyPart && (
            <Autocomplete
              freeSolo
              id="bodyPart"
              value={props.ad.bodyPart}
              onChange={handleAcChange}
              inputValue={adAcInputs.bodyPart}
              onInputChange={handleBodyPartInputChange}
              options={BODY_PARTS}
              disabled={!authUser}
              renderInput={params => (
                <TextField {...params} name="body-part" label="Body Part" />
              )}
            />
          )}
          {adMask.type && (
            <Autocomplete
              freeSolo
              id="type"
              value={props.ad.type}
              onChange={handleAcChange}
              inputValue={adAcInputs.type}
              onInputChange={handleTypeInputChange}
              options={TYPES}
              disabled={!authUser}
              renderInput={params => (
                <TextField {...params} name="type" label="Type" />
              )}
            />
          )}
          {adMask.title && (
            <TextField
              id="title"
              label="Title"
              name="title"
              value={props.ad.title}
              onChange={handleTextFieldChange}
              required
              disabled={!authUser}
            />
          )}
          {adMask.description && (
            <TextField
              id="description"
              label="Description"
              name="description"
              value={props.ad.description}
              onChange={handleTextFieldChange}
              required
              disabled={!authUser}
            />
          )}
          {adMask.isGiven && (
            <FormControlLabel
              control={
                <Checkbox
                  name="isGiven"
                  checked={props.ad.isGiven}
                  onChange={handleCheckboxChange} // TODO: might not work
                  disabled={!authUser}
                />
              }
              label="Is Given?"
            />
          )}
        </Stack>
        <hr />
        <Stack direction="row" justifyContent="space-between">
          {adMask.update &&
            (props.waitingSubmit ? (
              <Box>
                <CircularProgress />
              </Box>
            ) : (
              <Button
                type="submit"
                variant="contained"
                disabled={props.waitingPhoto || props.waitingPhotoDestroy}
              >
                Update
              </Button>
            ))}
          {adMask.destroy &&
            (props.waitingDestroy ? (
              <Box>
                <CircularProgress />
              </Box>
            ) : (
              <Button
                variant="outlined"
                color="warning"
                onClick={handleDestroy}
                disabled={props.waitingPhoto || props.waitingPhotoDestroy}
              >
                Destroy
              </Button>
            ))}
          {adMask.create &&
            (props.waitingSubmit ? (
              <Box>
                <CircularProgress />
              </Box>
            ) : (
              <Button
                type="submit"
                variant="contained"
                disabled={props.waitingPhoto || props.waitingPhotoDestroy}
              >
                Create
              </Button>
            ))}
        </Stack>
      </Container>
    </>
  )
}

export default AdForm

//    TODOs
// * problem synching when navigating to AdForm directly the interface says login, but the server didn't disconnect user session.
// * Let the user know his submit is being processed
// * New doesn't work from existing form (id already exists).
//    maybe
// * useReducer and shrink all methods to 2 submit buttons of create/update and destroy (and maybe more methods could be added).
// * update the state at parent immediatly, so that the new element will join its collection in irresolute state (maybe spinner)
// instead of waiting for the server to return a response.

// One primary advantage is that on navigation to the same component, some controls don't need to re-render.
// I decided to use the native form and submit button attributes, using a single handleSubmit event handler instead onclick events.
import React, { useContext, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import {
  Container,
  Stack,
  TextField,
  Button,
  Autocomplete,
  FormControlLabel,
  Checkbox
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
 * @param {*} props name, ad, onSubmit, onChange, onDestroy.
 * @summary
 * name: form to be rendered (rendered with filtered fields and buttons).
 * ad: ad from parent.
 * onChange: sets value for special fields such as checkbox and file and then invokes props.onChange().
 * @returns \<form> of existing or new ad.
 */
const AdForm = props => {
  const { authUser } = useContext(authContext)
  console.log(`${props.name}AdForm at ${useLocation().pathname}.`)
  const params = useParams()

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
        update: true,
        destroy: true
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
        create: true
      })
      break
    default:
      break
  }
  // Hiding Actions from a guest.
  if (!authUser) adMask.update = adMask.destroy = adMask.create = false

  //    Default behaviors of the form.
  const handleTextFieldChange = event => {
    const target = event.target
    const name = target.name
    let value = target.value
    switch (target.type) {
      case 'file':
        value = target.files[0]
        break
      case 'checkbox':
        value = target.checked
        break
      default:
    }
    props.onChange(name, value)
  }
  const handleSubmit = event => {
    event.preventDefault()
    const action = new URL(event.target.action).pathname
    props.onSubmit(action, method) // and not event.target.method since only get and post values can be set.
  }

  //    Autocomplete related
  // On first render only the input change event fires with null event and empty adAcInputs properties.
  // On autocomplete option check it firstly fires input change event (with click event) and then the autocomplete (listbox click) event, also with click event.
  // Autocomplete Click event - option selected from the listbox.
  const handleAcChange = (event, newValue) => {
    console.log('in handleAcChange')
    console.log(event)
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

  return (
    <>
      <Container
        component="form"
        sx={{
          width: '350px',
          marginTop: '10px'
        }}
        name={props.name}
        action={action}
        method={method} // browser will swap it with get, but in handleSubmit I will change it back to method.
        onSubmit={handleSubmit}
      >
        <Stack
          direction="column"
          spacing={3}
          alignItems="flex-start"
          height="350px"
          sx={{
            paddingTop: '10px',
            overflowY: 'scroll',
            '& .MuiAutocomplete-root': { width: '200px' }
          }}
        >
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
                  onChange={handleTextFieldChange} // TODO: might not work
                  disabled={!authUser}
                />
              }
              label="Is Given?"
            />
          )}
          {adMask.photo && (
            <Button
              variant="contained"
              component="label"
              startIcon={<AddAPhotoIcon />}
            >
              Upload a Photo
              <input
                id="photo"
                name="photo"
                type="file"
                onChange={handleTextFieldChange}
                disabled={!authUser}
                accept="image/*"
                hidden
              />
            </Button>
          )}
        </Stack>
        <hr />
        <Stack direction="row" justifyContent="space-between">
          {adMask.update && (
            <Button type="submit" variant="contained">
              Update
            </Button>
          )}
          {adMask.destroy && (
            <Button
              variant="outlined"
              color="warning"
              onClick={() => props.onDestroy()} // anonymous function for to ignore click event.
            >
              Destroy
            </Button>
          )}
          {adMask.create && (
            <Button type="submit" variant="contained">
              Create
            </Button>
          )}
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
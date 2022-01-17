// One primary advantage is that on navigation to the same component, some controls don't need to re-render.
// I decided to use the native form and submit button attributes, using a single handleSubmit event handler instead onclick events.
import React, { useContext, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { Box, Container, Stack, TextField, Button } from '@mui/material'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress
} from '@mui/material'
import { authContext } from '../../App'

/**
 * <model>Form component represents a form whos action, method and filtered controls are decided according to the name prop.
 * @param {*} props name, user, onSubmit, onChange, onDestroy, waitingSubmit.
 * @summary
 * name: form to be rendered (with filtered fields and buttons).
 * user: user from parent.
 * onChange: sets value for special fields such as checkbox and file and then invokes props.onChange().
 * @returns \<form> of existing or new user.
 */
const UserForm = props => {
  //    React router hooks and authentication context value
  const location = useLocation()
  console.log(`${props.name}UserForm at ${location.pathname}.`)
  const params = useParams()
  const { authUser } = useContext(authContext)

  //    Setting the action, method and userMask of the form.
  let [action, method] = ['', '']
  // A mask of boolean properties.
  const userMask = {
    id: false,
    email: false,
    password: false,
    name: false,
    update: false,
    destroy: false,
    create: false,
    login: false
  }
  // Fields (properties) of the form that will be rendered.
  switch (props.name) {
    case 'existing':
      ;[action, method] = [`/api/users/${params.id}`, 'put']
      Object.assign(userMask, {
        id: true,
        email: true,
        password: true,
        name: true,
        update: true,
        destroy: true
      })
      break
    case 'new':
      ;[action, method] = [`/api/users`, 'post']
      Object.assign(userMask, {
        email: true,
        password: true,
        name: true,
        create: true
      })
      break
    case 'login':
      ;[action, method] = [`/api/userSession`, 'post']
      Object.assign(userMask, {
        email: true,
        password: true,
        login: true
      })
      break
    default:
      break
  }
  // Hiding Actions from a guest.
  if (!authUser) userMask.update = userMask.destroy = false

  // Form validation errors handling.
  const initialUserErrors = {
    email: false,
    password: false,
    name: false
  }
  const [userErrors, setUserErrors] = useState(initialUserErrors)
  const initialUserErrorMsgs = { email: '', password: '', name: '' }
  const [userErrorMsgs, setUserErrorMsgs] = useState(initialUserErrorMsgs)

  //    Default behaviors of the form.
  const handleTextFieldChange = event => {
    const target = event.target
    const name = target.name
    let value = target.value
    let valid = target.validity.valid
    let validationMessage = target.validationMessage
    if (name === 'email') {
      if (target.validity.valid) {
        const dotAfterAtPos = value.substring(value.indexOf('@')).indexOf('.')
        // A . after @ isn't present.
        if (dotAfterAtPos === -1) {
          valid = false
          validationMessage = "You're missing a . after the @"
        }
      }
    }
    setUserErrors(userErrors => ({ ...userErrors, [name]: !valid }))
    setUserErrorMsgs(userErrorMsgs => ({
      ...userErrorMsgs,
      [name]: validationMessage
    }))
    props.onChange(name, value)
  }

  const handleSubmit = event => {
    event.preventDefault()
    const action = new URL(event.target.action).pathname
    props.onSubmit(action, method) // and not event.target.method since only get and post values can be set.
  }

  // Warning before destroying a user.
  const [isDestroyWarningOpen, setIsDestroyWarningOpen] = useState(false)

  const handleDestroyWarningOpen = () => {
    setIsDestroyWarningOpen(true)
  }
  const handleDestroyWarningClose = () => {
    setIsDestroyWarningOpen(false)
  }
  const handleDestroy = () => {
    setIsDestroyWarningOpen(false)
    props.onDestroy()
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
          height="300px"
          sx={{ paddingTop: '10px' }}
        >
          {userMask.id && (
            <TextField
              id="id"
              label="ID"
              name="id"
              value={props.user.id}
              onChange={handleTextFieldChange}
              disabled
              sx={{ width: '10ch' }}
            />
          )}
          {userMask.email && (
            <TextField
              id="email"
              label="Email"
              type="email"
              name="email"
              value={props.user.email}
              onChange={handleTextFieldChange}
              required
              error={userErrors.email}
              {...(userErrors.email && {
                helperText: userErrorMsgs.email
              })}
              InputProps={{ sx: { width: '200px' } }}
            />
          )}
          {userMask.password && (
            <TextField
              id="password"
              label="Password"
              type="password"
              name="password"
              value={props.user.password}
              onChange={handleTextFieldChange}
              required
              error={userErrors.password}
              {...(userErrors.password && {
                helperText: userErrorMsgs.password
              })}
              autoComplete={
                props.name === 'new' || props.name === 'existing'
                  ? 'new-password'
                  : 'current-password'
              }
              InputProps={{ sx: { width: '200px' } }}
              inputProps={{ maxLength: 20 }}
            />
          )}
          {userMask.name && (
            <TextField
              id="name"
              label="Name"
              name="name"
              value={props.user.name}
              onChange={handleTextFieldChange}
              required
              error={userErrors.name}
              {...(userErrors.name && {
                helperText: userErrorMsgs.name
              })}
            />
          )}
        </Stack>
        <hr />
        <Stack direction="row" justifyContent="space-between">
          {userMask.update && (
            <Button type="submit" variant="contained">
              Update
            </Button>
          )}
          {userMask.destroy && (
            <Button
              variant="outlined"
              color="warning"
              onClick={handleDestroyWarningOpen}
              sx={{ marginLeft: '25px' }}
            >
              Destroy
            </Button>
          )}
          {userMask.create &&
            (props.waitingSubmit ? (
              <Box>
                <CircularProgress />
              </Box>
            ) : (
              <Button type="submit" variant="contained">
                Create
              </Button>
            ))}
          {userMask.login &&
            (props.waitingSubmit ? (
              <Box>
                <CircularProgress />
              </Box>
            ) : (
              <Button type="submit" variant="contained">
                login
              </Button>
            ))}
        </Stack>
      </Container>
      <Dialog
        open={isDestroyWarningOpen}
        onClose={handleDestroyWarningClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Destroy the user (and his ads)?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            If you destroy this user, you will also destroy all of his ads, so
            be careful!
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDestroyWarningClose}>Disagree</Button>
          <Button color="warning" onClick={handleDestroy} autoFocus>
            Agree
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default UserForm

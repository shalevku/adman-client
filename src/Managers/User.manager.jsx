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
  Dialog,
  DialogTitle,
  Snackbar,
  Alert,
  Container,
  CircularProgress
} from '@mui/material'
import { authContext } from '../App'
import axios from 'axios'
import UserForm from '../ReactModels/User/UserForm'
import UsersTable from '../ReactModels/User/UsersTable'

/**
 * Decides what to render: collection or single (like in routes in server :)
 * @description manager of a model (collection and element).
 * @returns \<switch> of collection and element components.
 */
const UserManager = () => {
  //    React router hooks and authentication context value
  const history = useHistory()
  const location = useLocation()
  console.log(`UserManager at ${location.pathname}.`)
  const { id } = useParams()
  const auth = useContext(authContext)

  //    States
  // Collection
  const initialUsers = []
  const [users, setUsers] = useState(initialUsers)
  // Single
  const isEmpty = false // debug
  const initialUser = {
    id: '',
    email: isEmpty ? '' : `shalevku@gmail.com`,
    password: isEmpty ? '' : 'asdf',
    name: isEmpty ? '' : `Shalev Kubi`
  }
  const [user, setUser] = useState(initialUser)
  const initialUserRef = useRef(initialUser)
  // newUserForm Dialog
  const [isUserFormOpen, setUserFormOpen] = useState(false)
  // Feedback related
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false)
  const [sbAlert, setSbAlert] = useState({ text: '', severity: 'error' })
  const [waiting, setWaiting] = useState(false) // for ads or ad

  //    Create and update
  // Create
  const handleUserFormOpen = () => {
    setUserFormOpen(true)
  }
  const handleUserFormClose = () => {
    setUserFormOpen(false)
    if (id)
      if (users.length)
        setUser(users[users.findIndex(user => id === user.id.toString())])
      else readUser() // Maybe save the previous user somehow (because it is known that there might be canceling of the dialog).

    function readUser() {
      axios
        .get(`/api/users/${id}`)
        .then(({ data }) => {
          setUser(data)
        })
        .catch(error =>
          handleSnackbarOpen(
            error.response?.statusText || error.message,
            'error'
          )
        )
    }
  }
  // Submit form on create and update.
  const handleSubmit = (path, method) => {
    axios({
      method,
      url: path,
      headers: { 'content-type': 'application/json' },
      data: user
    })
      .then(({ data }) => {
        // Alert that the action was performed successfully.
        const pastTenses = {
          post: 'Created',
          put: 'Updated',
          delete: 'Deleted'
        }
        console.log(`${user.name} was ${pastTenses[method]}!`)

        // action is /api/users for sure.
        if (method === 'post') {
          setUserFormOpen(false)
          // in UsersTable/Carousel.
          if (!id) setUsers(prevUsers => prevUsers.concat(data))
          handleSnackbarOpen(`User ${user.name} created!`, 'success')
        } else if (method === 'put') {
          // id present anyways.
          // users in memory.
          if (users.length !== 0) {
            handleSnackbarOpen(
              `User ${id} updated! Redirecting in 6 seconds to table...`,
              'success'
            )
            setTimeout(() => {
              history.push('/users')
            }, 6000)
          } else handleSnackbarOpen(`User ${id} updated!`, 'success')
        }
      })
      .catch(error =>
        handleSnackbarOpen(error.response?.statusText || error.message, 'error')
      )
  }
  //    Read
  // URL changed.
  useEffect(() => {
    const initialUser = initialUserRef.current
    setWaiting(true)
    // /users
    if (!id) {
      // Read users
      axios
        .get('/api/users')
        .then(({ data }) => {
          setUsers(data)
          setWaiting(false)
        })
        .catch(error =>
          handleSnackbarOpen(
            error.response?.statusText || error.message,
            'error'
          )
        )
      setUser(initialUser) // navigated from a deleted element.
    }
    // /user/:id
    // Read users.
    else
      axios
        .get(`/api/users/${id}`)
        .then(({ data }) => {
          setUser(data)
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
  const handleDestroy = selectedIndices => {
    // /users. selectedIndices present.
    if (!id) {
      destroyUsers()
      // logout the user if he deleted himself
      const authUserIndex = users.findIndex(
        user => auth.authUser.id === user.id
      )
      if (selectedIndices.includes(authUserIndex)) console.log('in if')
      setTimeout(() => {
        console.log('about to logout')
        auth.logout()
      }, 3000)
    }
    // /user/:id
    else {
      destroyUser()
      setUser(initialUser)
      if (id === auth.authUser.id) auth.logout()
    }

    function destroyUsers() {
      while (selectedIndices.length) {
        const index = selectedIndices.pop()

        axios
          .delete(`/api/users/${users[index].id}`)
          .then(() => {
            setUsers(prevUsers => {
              prevUsers.splice(index, 1)
              return prevUsers.slice()
            })
            handleSnackbarOpen('User(s) destroyed!', 'success')
          })
          .catch(error =>
            handleSnackbarOpen(
              error.response?.statusText || error.message,
              'error'
            )
          )
      }
    }

    function destroyUser() {
      axios
        .delete(`/api/users/${id}`)
        .then(() => {
          // form is directly navigated.
          if (!users.length) {
            setUser(initialUser)
            handleSnackbarOpen({
              text: `User ${id} deleted!`,
              severity: 'success'
            })
          } else history.replace('/users')

          handleSnackbarOpen('User destroyed!', 'success')
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
    setUser(prevUser => ({ ...prevUser, [name]: value }))
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

  // upated/deleted from an independant page.
  if (sbAlert.text.includes('delete')) return <div>{sbAlert.text}</div>
  return (
    <>
      <Switch>
        <Route exact path="/users">
          {waiting ? (
            <Container sx={{ width: '150px', paddingTop: '100px' }}>
              <CircularProgress size={100} />
            </Container>
          ) : (
            <UsersTable
              initialElement={initialUser}
              rows={users}
              onDestroy={handleDestroy}
            />
          )}
        </Route>
        <Route path="/users/:id">
          {waiting ? (
            <Container sx={{ width: '150px', paddingTop: '100px' }}>
              <CircularProgress size={100} />
            </Container>
          ) : (
            <UserForm
              name="existing"
              user={user}
              onSubmit={handleSubmit}
              onChange={handleChange}
              onDestroy={handleDestroy}
            />
          )}
        </Route>
      </Switch>
      {/* Create button */}
      {auth.authUser && (
        <Button variant="contained" onClick={handleUserFormOpen}>
          Create a New user
        </Button>
      )}
      {/* Create dialog form */}
      <Dialog
        open={isUserFormOpen}
        onClose={handleUserFormClose}
        scroll="body"
        PaperProps={{ sx: { padding: '0px 10px 10px' } }}
      >
        <DialogTitle sx={{ fontSize: '1rem', padding: '8px 24px' }}>
          Create a new user
        </DialogTitle>
        <UserForm
          name="new"
          user={user}
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

export default UserManager

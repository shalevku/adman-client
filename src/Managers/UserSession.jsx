import { useState, useEffect, useContext } from 'react'
import { Route, Switch, useHistory, useLocation } from 'react-router-dom'
import {
  RadioGroup,
  Radio,
  FormControlLabel,
  Snackbar,
  Alert
} from '@mui/material'
import { authContext } from '../App'
import axios from 'axios'
import UserForm from '../ReactModels/User/UserForm'

const UserSession = props => {
  //    React router hooks
  const history = useHistory()
  const location = useLocation()
  console.log(`UserSession at ${location.pathname}.`)
  //    Authentication context value
  const auth = useContext(authContext)
  // Feedback related
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false)
  const [sbAlert, setSbAlert] = useState({ text: '', severity: 'error' })

  //    States
  const initialUser = {
    id: '',
    email: 'shalevku@gmail.com',
    password: 'asdf',
    name: 'Shalev Kubi'
  }
  const [user, setUser] = useState(initialUser) // just for same user between createAccount and login.
  const [waitingSubmit, setWaitingSubmit] = useState(false)

  //    Create and login
  const handleSubmitUser = (path, method) => {
    setWaitingSubmit(true)
    axios({
      method,
      url: path,
      headers: { 'content-type': 'application/json' },
      data: user
    })
      .then(({ data }) => {
        setWaitingSubmit(false)
        // Alert that the path was performed successfully.
        const pastTenses = {
          post: path === '/api/users' ? 'Created' : 'Logged in',
          put: 'Updated',
          delete: 'Deleted'
        }
        console.log(`${user.name} was ${pastTenses[method]}!`)
        switch (path) {
          case '/api/users':
            history.push('/login')
            handleSnackbarOpen(`User ${user.name} created!`, 'success')
            break
          case '/api/userSession':
            auth.login(data)
            break
          default:
            break
        }
      })
      .catch(error =>
        handleSnackbarOpen(
          error.response.status === 500
            ? 'The email is taken by someone else.'
            : 'Email or password is incorrect',
          'error'
        )
      )
  }

  //    Standard form change handler
  const handleChange = (name, value) => {
    setUser(user => ({ ...user, [name]: value }))
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

  return (
    <>
      <Switch>
        <Route exact path="/login">
          <UserForm
            name="login"
            user={user}
            onSubmit={handleSubmitUser}
            onChange={handleChange}
            waitingSubmit={waitingSubmit}
          />
        </Route>
        <Route exact path="/createAccount">
          <UserForm
            name="new"
            user={user}
            onSubmit={handleSubmitUser}
            onChange={handleChange}
            waitingSubmit={waitingSubmit}
          />
        </Route>
      </Switch>
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

export default UserSession

export const UserAuthSwitch = () => {
  //    React router hooks
  const history = useHistory()
  const location = useLocation()

  // Radio Group
  const [selectedPage, setSelectedPage] = useState('')

  // Switch between login and createAccount user forms.
  const handlePageChange = event => {
    const selectedPage = event.target.value
    // replace if login or newAccount, else push.
    if (
      location.pathname === '/login' ||
      location.pathname === '/createAccount'
    )
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
        name="user-session-page-switcher"
        value={selectedPage} // from path.
        onChange={handlePageChange}
        row
      >
        <FormControlLabel value="/login" control={<Radio />} label="Login" />
        <FormControlLabel
          value="/createAccount"
          control={<Radio />}
          label="Create Account"
        />
      </RadioGroup>
    </div>
  )
}

//      TODOS:
//      Maybe:
// * do the login request a get request that the server will check if the user has a session and if not
// it will log him in if he exists or reject if not. (so its a get request with a body).
// * Try the handler directly in the input property.
// * Reset form input doesn't work, try it.

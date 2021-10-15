// Remark: auth stands for authentication.
import React, { useState, useContext } from 'react'
import {
  Switch,
  Route,
  Redirect,
  Link as RouterLink,
  useHistory,
  useLocation
} from 'react-router-dom'
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Link,
  Button,
  IconButton
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import dataService from './services/Data.service'
import UserSessionManager, { UserAuthSwitch } from './Managers/UserSession'
import AdManager, { AdSwitch } from './Managers/Ad.manager'
import UserManager from './Managers/User.manager'

const authContext = React.createContext()
const AD_MANAGER_URLs = ['/ads/:id', '/ads', '/adsCarousel']
const USER_MANAGER_URLs = ['/users/:id', '/users']

const App = () => {
  const history = useHistory()
  const location = useLocation()
  console.log(`App at ${location.pathname}.`)

  const [authUser, setAuthUser] = useState(null)

  const login = authUser => {
    setAuthUser(authUser)
    const { from } = location.state || { from: { pathname: '/' } }
    history.replace(from)
  }

  const logout = async () => {
    await dataService('/api/userSession', 'delete')
    setAuthUser(null)
  }

  const auth = { authUser, login, logout }

  return (
    <authContext.Provider value={auth}>
      <>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" color="inherit" sx={{ mb: '3px' }}>
            <Toolbar>
              {/* hamburger menu */}
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              {/* Homepage link */}
              <Typography
                variant="h1"
                component="h1"
                fontSize="16px"
                sx={{ flexGrow: 1 }}
              >
                <Link
                  underline="hover"
                  component={RouterLink}
                  to="/"
                  title="Back to the homepage."
                >
                  Clothes Donation
                </Link>
              </Typography>
              {/* Manager heading */}
              <Switch>
                <Route path={USER_MANAGER_URLs}>
                  {/* Users heading (or link) to manage users */}
                  <Typography
                    variant="h2"
                    component="h2"
                    fontSize="14px"
                    sx={{ flexGrow: 1 }}
                  >
                    Manage Users
                  </Typography>
                </Route>
                <Route path={['/login', '/createAccount']}>
                  <Typography
                    variant="h2"
                    component="h2"
                    fontSize="14px"
                    sx={{ flexGrow: 1 }}
                  >
                    User Session!
                  </Typography>
                  <UserAuthSwitch />
                </Route>
                <Route path={AD_MANAGER_URLs}>
                  <Typography
                    variant="h2"
                    component="h2"
                    fontSize="14px"
                    sx={{ flexGrow: 1 }}
                  >
                    Ads Manager!
                  </Typography>
                </Route>
              </Switch>
              <Route path={AD_MANAGER_URLs}>
                <AdSwitch />
              </Route>

              {location.pathname !== '/users' && (
                <Link component={RouterLink} to="/users">
                  Users
                </Link>
              )}

              {/* Logout and login controls. */}
              {auth.authUser ? (
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={logout}
                  title="Logout from your account"
                  sx={{ mr: 2 }}
                >
                  Logout {auth.authUser.name}
                </Button>
              ) : (
                !/login|createAccount/.test(location.pathname) && (
                  <Link
                    underline="hover"
                    component={RouterLink}
                    to={{
                      pathname: '/login',
                      state: { from: location }
                    }}
                    title="Manage your ads."
                    sx={{ mr: 2 }}
                  >
                    Login
                  </Link>
                )
              )}
            </Toolbar>
          </AppBar>
        </Box>
        <Switch>
          {/* Maybe instead of a redirect I'll do a main menu. */}
          <Redirect exact path="/" to="/ads" />
          <Route path={AD_MANAGER_URLs}>
            <AdManager />
          </Route>
          <PrivateRoute path={USER_MANAGER_URLs}>
            <UserManager />
          </PrivateRoute>
          <Route path={['/login', '/createAccount']}>
            <UserSessionManager />
          </Route>
        </Switch>
      </>
    </authContext.Provider>
  )
}
// A wrapper that redirects unauthenticated users.
const PrivateRoute = props => {
  const { authUser } = useContext(authContext)
  const location = useLocation()
  console.log(`PrivateRoute: location: ${location.pathname}`)

  return (
    <Route path={props.path}>
      {authUser
        ? props.children
        : !console.log('please login first!') && (
            <Redirect
              to={{
                pathname: '/login',
                state: { from: location }
              }}
            />
          )}
    </Route>
  )
}
export { authContext }
export default App

// * try with default value for context (without provider).
// * take care of when server send errors.

// Remarks:
// I chose to unite <model> forms into one because of the efficiency of rendering the same controls and state
// that can be the same between them such as between login and new user.

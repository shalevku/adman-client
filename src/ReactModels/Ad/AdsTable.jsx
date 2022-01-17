import _ from 'lodash'
import React, { useState, useEffect, useContext } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'
import { alpha } from '@mui/material/styles'
import { Box, Stack, Divider, Paper, TextField } from '@mui/material'
import {
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel
} from '@mui/material'
import {
  Switch,
  Typography,
  CircularProgress,
  Checkbox,
  Tooltip,
  FormControlLabel,
  IconButton
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import FilterListIcon from '@mui/icons-material/FilterList'
import { visuallyHidden } from '@mui/utils'
import { authContext } from '../../App'

/**
 *
 * @param {*} props headers, onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort.
 * as array of objects of structure [{id: string, isAlignRight: boolean, disablePadding: boolean, label: string},...]
 * @returns \<div> (probably) as MUI TableHead.
 */
const EnhancedTableHead = props => {
  const { authUser } = useContext(authContext)
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort
  } = props

  const createSortHandler = header => event => {
    onRequestSort(event, header)
  }

  const handleChange = event => {
    const target = event.target
    const name = target.name
    const value = target.value
    props.onChange(name, value)
  }

  return (
    <TableHead>
      <TableRow>
        {authUser && (
          <TableCell padding="checkbox">
            <Checkbox
              color="primary"
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={rowCount > 0 && numSelected === rowCount}
              onChange={onSelectAllClick}
              inputProps={{
                'aria-label': 'select all ads'
              }}
            />
          </TableCell>
        )}
        {props.headers.map(header => (
          <TableCell
            key={header.id}
            align={header.isAlignRight ? 'right' : 'left'}
            padding={header.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === header.id ? order : false}
          >
            {!props.filterOn ? (
              <TableSortLabel
                active={orderBy === header.id}
                direction={orderBy === header.id ? order : 'asc'}
                onClick={createSortHandler(header.id)}
              >
                <b>
                  {_.startCase(
                    header.label === 'photo' ? 'photo' : header.label
                  )}
                </b>
                {orderBy === header.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'asc' ? 'sorted ascending' : 'sorted descending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            ) : (
              <TextField
                id={header.id}
                name={header.id}
                value={props.rowFilter[header.id]}
                onChange={handleChange}
                label={header.label}
                size="small"
              />
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )
}

EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired
}

/**
 *  Table with paging, sorting and filtering.
 * @param {*} props initialElement, rows, onDestroy, onPhotoDestroy, waitingDestroy.
 * @returns \<div> (probably) as MUI TableContainer with "edit item" and "destroy" ad actions.
 */
const EnhancedTable = props => {
  const { authUser } = useContext(authContext)
  //    React router hooks
  const location = useLocation()
  console.log(`AdsTable at ${location.pathname}.`)

  //    Enhanced table related
  const [selectedIndices, setSelectedIndices] = useState([])
  const [page, setPage] = useState(0)
  const [dense, setDense] = useState(true)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const headers = []
  // Setting the headers objects
  Object.entries(props.initialElement).forEach(([key, value], index) => {
    headers.push({
      id: key,
      isAlignRight: typeof value !== 'string' && key !== 'id' ? true : false,
      disablePadding: index === 0 ? true : false,
      label: key
    })
  })

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - props.rows.length) : 0

  const handleSelectAllClick = event => {
    let newSelectedRowsIds = []
    if (event.target.checked)
      newSelectedRowsIds = props.rows.map((row, index) => index)
    setSelectedIndices(newSelectedRowsIds)
  }
  const handleRowClick = (event, index) => {
    let newSelectedIndices = [...selectedIndices]
    // add the checked index
    if (!newSelectedIndices.includes(index)) {
      newSelectedIndices.push(index)
    }
    // delete the present index
    else newSelectedIndices.splice(newSelectedIndices.indexOf(index), 1) // TODO: maybe use a map or object instead for efficiency.
    setSelectedIndices(newSelectedIndices)
  }
  const handleDestroy = event => {
    // Destroy each ad's photo, if exist.
    selectedIndices.forEach(index => {
      // TODO: might want to send in one request.
      const currentAd = props.rows[index]
      // if photo exist, destroy it.
      if (currentAd.photo !== '/default.png') {
        const key = new URL(currentAd.photo).pathname
        props.onPhotoDestroy(key)
      }
    })
    // Destroy the ads themselves.
    props.onDestroy(selectedIndices)
  }
  const handlePageChange = (event, newPage) => {
    setPage(newPage)
  }
  const handleRowsPerPageChange = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }
  const handleDenseChange = event => {
    setDense(event.target.checked)
  }

  //    Sorting related
  const [order, setOrder] = useState('asc')
  const [orderBy, setOrderBy] = useState('calories')

  // Helper for sort.
  const getComparator = (order, orderBy) => {
    const ascendingComparator = (r1, r2, orderBy) => {
      if (r1[orderBy] < r2[orderBy]) {
        return -1
      }
      if (r1[orderBy] > r2[orderBy]) {
        return 1
      }
      return 0
    }

    return order === 'asc'
      ? (r1, r2) => ascendingComparator(r1, r2, orderBy)
      : (r1, r2) => -ascendingComparator(r1, r2, orderBy)
  }
  const handleRequestSort = (event, header) => {
    setOrderBy(header)
    // flip order if the user clicked on the current orderBy header
    const isAsc = orderBy === header && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
  }

  //    Filter related
  const [filterOn, setFilterOn] = useState(false)
  const [filteredRows, setFilteredRows] = useState([])
  const [rowFilter, setRowFilter] = useState(
    Object.fromEntries(headers.map(header => [header.id, '']))
  )

  const handleFilterOn = event => {
    setFilterOn(filterOn => !filterOn)
    setFilteredRows(props.rows)
  }
  const handleChange = (name, value) => {
    setRowFilter(rowFilter => ({ ...rowFilter, [name]: value }))
  }

  useEffect(() => {
    // TODO: might want to act on filtered rows when adding chars and on props.rows when deleting them (or use a memento pattern).
    const newFilteredRows = props.rows.filter(row => {
      return Object.keys(rowFilter).every(rfkey => {
        let value = row[rfkey]
        if (typeof value === 'number') value = value.toString()
        else if (typeof value === 'boolean') value = value ? 'Yes' : 'No'
        return value.includes(rowFilter[rfkey])
      })
    })
    setFilteredRows(newFilteredRows)
  }, [props, rowFilter])

  return (
    <Box>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer sx={{ height: '350px', overflowY: 'scroll' }}>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="Ads Table"
            size={dense ? 'small' : 'medium'}
            stickyHeader
            aria-label="sticky table"
          >
            <EnhancedTableHead
              headers={headers}
              numSelected={selectedIndices.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={props.rows.length}
              filterOn={filterOn}
              onChange={handleChange}
              rowFilter={rowFilter}
            />
            <TableBody>
              {(filterOn ? filteredRows : props.rows)
                .slice()
                .sort(getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const isItemSelected = selectedIndices.includes(index)
                  const checkboxLabelId = `enhanced-table-checkbox-${index}`

                  return (
                    <TableRow
                      key={row.id}
                      hover
                      onClick={event => handleRowClick(event, index)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      selected={isItemSelected}
                    >
                      {authUser && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            inputProps={{
                              'aria-labelledby': checkboxLabelId
                            }}
                          />
                        </TableCell>
                      )}
                      <TableCell padding="none">
                        <Link
                          underline="hover"
                          component={RouterLink}
                          to={`/ads/${row.id}`}
                        >
                          {row.id}
                        </Link>
                      </TableCell>

                      {Object.keys(
                        // specific to user.
                        _.omit(row, ['id', 'createdAt', 'updatedAt', 'UserId'])
                      ).map(key => {
                        let cellValue = row[key]

                        if (typeof row[key] === 'boolean')
                          cellValue = row[key] ? 'Yes' : 'No'
                        else if (key === 'photo')
                          cellValue = row.photo && (
                            <img
                              src={row.photo}
                              alt={`${row.title}`}
                              width="100px"
                              height="100px"
                            />
                          )

                        return (
                          <TableCell
                            key={`${row.id}-${row[key]}`}
                            {...(key === 'title'
                              ? {
                                  component: 'th',
                                  id: checkboxLabelId,
                                  scope: 'row'
                                }
                              : {
                                  align:
                                    typeof row[key] !== 'string'
                                      ? 'right'
                                      : 'left'
                                })}
                          >
                            {cellValue}
                          </TableCell>
                        )
                      })}
                      <TableCell>
                        <Link
                          underline="hover"
                          component={RouterLink}
                          to={`/users/${row.UserId}`}
                        >
                          {row.UserId}
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: (dense ? 33 : 53) * emptyRows
                  }}
                >
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <EnhancedTableToolbar
          dense={dense}
          onDenseChange={handleDenseChange}
          rowsCount={props.rows.length}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          page={page}
          onPageChange={handlePageChange}
          selectedIndices={selectedIndices}
          onDestroy={handleDestroy}
          onFilterOn={handleFilterOn}
          waitingDestroy={props.waitingDestroy}
        />
      </Paper>
    </Box>
  )
}

/**
 *  Extracted for ease of read of the EnhancedTable component.
 * @param {*} props selectedIndices, onDestroy
 * @returns
 */
function EnhancedTableToolbar(props) {
  const numSelected = props.selectedIndices.length

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      divider={<Divider orientation="vertical" flexItem />}
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: theme =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity
            )
        })
      }}
    >
      {numSelected > 0 ? (
        <Typography color="inherit" variant="subtitle1" component="div">
          {numSelected} selected
        </Typography>
      ) : (
        <Typography variant="h4" id="tableTitle" component="div">
          Ads
        </Typography>
      )}
      <FormControlLabel
        control={
          <Switch checked={props.dense} onChange={props.onDenseChange} />
        }
        label="Dense padding"
      />

      {numSelected > 0 ? (
        <Tooltip title="Delete">
          {props.waitingDestroy ? (
            <Box>
              <CircularProgress />
            </Box>
          ) : (
            <IconButton onClick={props.onDestroy}>
              <DeleteIcon />
            </IconButton>
          )}
        </Tooltip>
      ) : (
        <Tooltip title="Filter list">
          <IconButton onClick={props.onFilterOn}>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      )}
      <TablePagination
        rowsPerPageOptions={[5, 10, { value: props.rowsCount, label: 'All' }]}
        component="div"
        count={props.rowsCount}
        rowsPerPage={props.rowsPerPage}
        page={props.page}
        onPageChange={props.onPageChange}
        onRowsPerPageChange={props.onRowsPerPageChange}
      />
    </Stack>
  )
}

export default EnhancedTable

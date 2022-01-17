var elements = ['v0', 'v1', 'v2', 'v3', 'v4', 'v5'],
  indexesToBeRemoved = [0, 2, 4]

while (indexesToBeRemoved.length) {
  elements.splice(indexesToBeRemoved.pop(), 1)
  console.log(indexesToBeRemoved)
}

console.log(elements)

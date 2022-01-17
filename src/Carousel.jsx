import React from 'react'
import { useLocation } from 'react-router-dom'
import Slider from 'react-slick'

/**
 *
 * @param {*} props value
 * value: array of elements to render.
 * @returns
 */
const Carousel = props => {
  const location = useLocation()
  console.log(`Carousel at ${location.pathname}.`)

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1
  }

  return (
    <div id="slick-slider-wrapper">
      <Slider {...settings}>
        {props.value.map(
          element =>
            element.photo && (
              <img
                key={element.id}
                src={element.photo}
                alt={element.title}
                width="1090px"
                height="400px"
              />
            )
        )}
      </Slider>
    </div>
  )
}

export default Carousel

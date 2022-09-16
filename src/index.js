import './styles/main.css';
import { formTemplate } from './templates/templates.js';

// const ymaps = window.ymaps;
// document.addEventListener('DOMContentLoaded', () => ymaps.ready(init));

let ymaps;
document.addEventListener('DOMContentLoaded', () => {
  ymaps = window.ymaps;
  ymaps.ready(init);
});

let clusterer;

function init() {
  const myMap = new ymaps.Map('map', {
    center: [55.76, 37.64],
    zoom: 12,
    controls: ['zoomControl'],
    // behaviors: ['drag']
  });
  myMap.events.add('click', function (e) {
    const coords = e.get('coords');

    openBalloon(myMap, coords, []);
  });
  clusterer = new ymaps.Clusterer({ clusterDisableClickZoom: true });
  clusterer.options.set('hasBalloon', false);
  renderGeoObject(myMap);

  clusterer.events.add('click', function (e) {
    const geoObjectsInClusterer = e.get('target').getGeoObjects();
    openBalloon(myMap, e.get('coords'), geoObjectsInClusterer);
  });
}

function getReviewsFromLS() {
  const reviews = localStorage.reviews;
  return JSON.parse(reviews || '[]');
}

function getReviewList(currentGeoObjects) {
  let reviewListHTML = '';
  for (const review of getReviewsFromLS()) {
    if (
      currentGeoObjects.some(
        (geoObject) =>
          JSON.stringify(geoObject.geometry._coordinates) ===
          JSON.stringify(review.coords)
      )
    ) {
      reviewListHTML += `
      <div class="review">
        <div><strong>Место: </strong>${review.place}</div>
        <div><strong>Имя: </strong>${review.author}</div>
        <div class="review-text"><strong>Отзыв: </strong>${review.reviewText}</div>
      </div>
      `;
    }
  }
  return reviewListHTML;
}

function renderGeoObject(map) {
  const geoObject = [];
  for (const review of getReviewsFromLS()) {
    const placemark = new ymaps.Placemark(review.coords);
    placemark.events.add('click', (e) => {
      e.stopPropagation();
      openBalloon(map, review.coords, [e.get('target')]);
    });
    geoObject.push(placemark);
  }
  clusterer.removeAll();
  map.geoObjects.remove(clusterer);
  clusterer.add(geoObject);
  map.geoObjects.add(clusterer);
}

async function openBalloon(map, coords, currentGeoObjects) {
  await map.balloon.open(coords, {
    content:
      `<div class="reviews">${getReviewList(currentGeoObjects)}</div>` + formTemplate,
  });
  document.querySelector('#add-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const review = {
      coords: coords,
      author: this.elements.author.value,
      place: this.elements.place.value,
      reviewText: this.elements.review.value,
    };
    localStorage.reviews = JSON.stringify([...getReviewsFromLS(), review]);

    renderGeoObject(map);

    map.balloon.close();
  });
}

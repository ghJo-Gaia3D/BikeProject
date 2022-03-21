<template>
  <div id="map" class="map"></div>
</template>

<script>
export default {
  name: 'Home',
  props: {
    
  },
}

import $ from 'jquery';
import 'ol/ol.css';
import {Map, View} from 'ol';    
import {XYZ} from 'ol/source';
import TileLayer from 'ol/layer/Tile';

import Vector from 'ol/source/Vector';
import {Vector as VectorLayer, Group} from 'ol/layer';

import GeoJSON from 'ol/format/GeoJSON';
import {bbox as bboxStrategy} from 'ol/loadingstrategy';
import Overlay from 'ol/Overlay'

import {defaults as defaultControls,FullScreen, ScaleLine, } from 'ol/control.js';
import {defaults as defaultInteractions, DragPan, MouseWheelZoom } from 'ol/interaction';
import KeyboardPan from 'ol/interaction/KeyboardPan';
import KeyboardZoom from 'ol/interaction/KeyboardZoom';

import {Stroke, Style, Fill, Circle as CircleStyle} from 'ol/style';
import Icon from 'ol/style/Icon';
import injeungP from '../assets/injeungP.svg';
import rentalP from '../assets/rentalP.svg';
import lightP from '../assets/lightP.svg';
import toiletP from '../assets/toiletP.svg';

import Feature from 'ol/Feature.js';
import Geolocation from 'ol/Geolocation.js';
import Point from 'ol/geom/Point.js';
// import {Cluster} from 'ol/source';


const setArea = ['Paju', 'Okcheon', 'Gunsan', 'Namyangju', 'Muan', 'Chungju', 'Seoul', 
                  'Sinan', 'Ongjin', 'Suseongdong', 'Jeju', 'Sangju', 'Incheon', 'Hwacheon', 
                  'Changwon', 'Busan', 'Gyeongju', 'Gangneung'
] ;
const bikeArray = [
  {name:'파주DMZ자전거길'},{name:'옥천향수100리길'},{name:'금강자전거길'},
  {name:'북한강자전거길'},{name:'영산강자전거길'},{name:'남한강자전거길'},
  {name:'한강자전거길'},{name:'신안증도자전거섬'},{name:'옹진덕적도자전거길'},
  {name:'정읍정읍천자전거길'},{name:'제주해맞이해안로'},{name:'새재자전거길'},
  {name:'아라자전거길'},{name:'화천파로호자전거길'},{name:'창원주남저수지자전거길'},
  {name:'낙동강자전거길'},{name:'경주역사탐방자전거길'},{name:'강릉경포호산소길'}
];


$(document).ready(function() {
  // 팝업창 초기 설정
  const container = document.getElementById('popup');
  const closer = document.getElementById('popup-closer');
  const overlay = new Overlay({
    element: container,
    autoPan: {
      animation: {
        duration: 250,
      },
    },
  }); 

  // if($('#popup').val() == " ") {
  //   console.log($('#popup').val())
  //   console.log('empty and hide')
  // } else {
  //   console.log('show')
  // }

//2BDE3AC0-CF24-34B9-981F-572853838825
  // 배경 맵 setting
  let baseMap = new TileLayer({
    source: new XYZ({
      url: 'http://xdworld.vworld.kr:8080/2d/Base/201512/{z}/{x}/{y}.png'
    }),
    visible:true
  });
  let grayMap = new TileLayer({
    source: new XYZ({
      url: 'http://xdworld.vworld.kr:8080/2d/gray/201512/{z}/{x}/{y}.png'
    }),
    visible:false
  });
  let midnightMap = new TileLayer({
    source: new XYZ({
      url: 'http://xdworld.vworld.kr:8080/2d/midnight/201512/{z}/{x}/{y}.png'
    }),
    visible:false
  });
  let hybridMap = new TileLayer({
    source: new XYZ({
      url: 'http://xdworld.vworld.kr:8080/2d/Hybrid/201512/{z}/{x}/{y}.png'
    }),
    visible:false
  });
  let satelliteMap = new TileLayer({
    source: new XYZ({
      url: 'http://xdworld.vworld.kr:8080/2d/Satellite/201301/{z}/{x}/{y}.jpeg'
    }),
    visible:false
  });

  //openlayers Map setting
  let map = new Map({
    controls: defaultControls().extend([
          new FullScreen(), new ScaleLine({ units: 'metric' }),
    ]),
    keyboardEventTarget: document,
    layers: [
      baseMap, grayMap, midnightMap, satelliteMap, hybridMap
    ],
    target: 'map',
    overlays: [overlay],
    view: new View({
        center: [14250000, 4280000],
        zoom: 7.3
    }),
    interactions: defaultInteractions().extend([
      new DragPan(), new MouseWheelZoom(), new KeyboardPan(), new KeyboardZoom()
    ]),
  });

// 배경 맵 변환
 $('#basemaps').on('change',  function() {
    let value = $('#basemaps').val();
    console.log(value);
    if(value == "BaseMap") {
      grayMap.setVisible(!value);
      midnightMap.setVisible(!value);
      hybridMap.setVisible(!value);
      satelliteMap.setVisible(!value);
      baseMap.setVisible(value);
    } else if(value == "GrayMap") {
      baseMap.setVisible(!value);
      midnightMap.setVisible(!value);
      hybridMap.setVisible(!value);
      satelliteMap.setVisible(!value);
      grayMap.setVisible(value);
    } else if(value == "MidnightMap") {
      baseMap.setVisible(!value);
      grayMap.setVisible(!value);
      satelliteMap.setVisible(!value);
      midnightMap.setVisible(value);
      hybridMap.setVisible(value);
    } else if(value == "SatelliteMap") {
      baseMap.setVisible(!value);
      grayMap.setVisible(!value);
      midnightMap.setVisible(!value);
      satelliteMap.setVisible(value);
      hybridMap.setVisible(value);
    } 
  })

  // bike_line WFS Layer
  let bikeLine = new Vector({
    format: new GeoJSON(),
    url: extent => {
      return process.env.VUE_APP_GEOSERVER_URI + '/ows?' +
        'service=WFS' +
        '&version=1.0.0' +
        '&request=GetFeature' +
        '&typeName=bike:bike_line_total' +
        '&srsName=EPSG:3857' +
        '&outputFormat=application/json' +
        '&bbox=' + extent.join(',') + ',EPSG:3857';
    },
    strategy: bboxStrategy
  });

  
  let colorStyle;
  let weather;
  let styleArray = [];

  for(let i = 0; i < setArea.length; i++) {
    $.ajax({
      url:`https://api.openweathermap.org/data/2.5/weather?q=${setArea[i]}&appid=3286e1d0641472a3bf3eaf032d05e804&units=metric`,
      dataType: 'json',
      type: 'GET',
      async: false,
      success: function(data) {
        weather = data.weather[0].main;
        // 날씨에 따른 색상구분 부분  
          if(weather == 'Clear' || weather == 'Clouds') {
            colorStyle = 'rgba(0, 204, 0, 1)' ;
          } else if(weather == 'Drizzle') {
            colorStyle = 'rgba(255, 255, 0, 1)' ;
          } else if(weather == 'Rain' || weather == 'Snow' || weather == 'Thunderstorm' || 
                    weather == 'Fog' || weather == 'Mist' || weather == 'Smoke' || weather == 'Haze' || weather == 'Sand' ||
                    weather == 'Ash' || weather == 'Squall' || weather == 'Tornado') {
            colorStyle = 'rgba(255, 0, 0, 1)' ;
          }   
        styleArray.push({name: setArea[i], color: colorStyle});
      }
    }) 
  }

  // 자전거길 이름별 style 적용
  let bikeLineLayer = new VectorLayer({
    source: bikeLine,
    visible: true,
    title: 'bikeLineLayer',
    style:  function (feature) {
      let an = feature.get('areaname');
      let style;
      if(an== 'Paju') {
            style = new Style({
                stroke: new Stroke({
                  width: 3,
                  color: styleArray[0].color,  
                })
              });
          } else if(an=='Okcheon') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[1].color,
              })
            });
          } else if(an=='Gunsan') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[2].color,
              })
            });
          } else if(an=='Namyangju') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[3].color,
              })
            });
          } else if(an=='Muan') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[4].color,
              })
            });
          } else if(an=='Chungju') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[5].color,
              })
            });
          } else if(an=='Seoul') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[6].color,
              })
            });
          } else if(an=='Sinan') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[7].color,
              })
            });
          } else if(an=='Ongjin') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[8].color,
              })
            });
          } else if(an=='Suseongdong') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[9].color,
              })
            });
          } else if(an=='Jeju') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[10].color,
              })
            });
          } else if(an=='Sangju') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[11].color,
              })
            });
          } else if(an=='Incheon') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[12].color,
              })
            });
          } else if(an=='Hwacheon') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[13].color,
              })
            });
          } else if(an=='Changwon') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[14].color,
              })
            });
          } else if(an=='Busan') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[15].color,
              })
            });
          } else if(an=='Gyeongju') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[16].color,
              })
            });
          } else if(an=='Gangneung') {
            style = new Style({
              stroke: new Stroke({
                width: 5,
                color: styleArray[17].color,
              })
            });
          }
      return style;
    }
  });
 
  // injeungPoint(인증센터) WFS Layer 
  let injeungPoint = new Vector({
    format: new GeoJSON(),
    url: extent => {
      return process.env.VUE_APP_GEOSERVER_URI + '/ows?' +
        'service=WFS' +
        '&version=1.0.0' +
        '&request=GetFeature' +
        '&typeName=bike:injeungpoint' +
        '&srsName=EPSG:4326' +
        '&outputFormat=application/json' +
        '&bbox=' + extent.join(',') + ',EPSG:3857';
    },
    strategy: bboxStrategy
  });
  // let injeungCluster = new Cluster({
  //     source: injeungPoint,
  //     distance: 35
  //   });
  let injeungLayer = new VectorLayer({
    source: injeungPoint,
    visible: false,
    title: 'injeungLayer',
    style: new Style({
      image: new Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        scale: 1.3,
        src: injeungP,
      })
    })
  });

  // rentalPoint(자전거 대여소) WFS Layer
  let rentalPoint = new Vector({
    format: new GeoJSON(),
    url: extent => {
      return process.env.VUE_APP_GEOSERVER_URI + '/ows?' +
        'service=WFS' +
        '&version=1.0.0' +
        '&request=GetFeature' +
        '&typeName=bike:rentalpoint' +
        '&srsName=EPSG:4326' +
        '&outputFormat=application/json' +
        '&bbox=' + extent.join(',') + ',EPSG:3857';
    },
    strategy: bboxStrategy
  });
  // let rentalCluster = new Cluster({
  //   source: rentalPoint,
  //   distance: 50
  // });
  let rentalLayer = new VectorLayer({
    source: rentalPoint,
    visible: false,
    title: 'rentalLayer',
    style: new Style({
      image: new Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        scale: 1.3,
        src: rentalP,
      })
    }),
    
  });

  // lightPoint(가로등) WFS Layer
  let lightPoint = new Vector({
    format: new GeoJSON(),
    url: extent => {
      return process.env.VUE_APP_GEOSERVER_URI + '/ows?' +
        'service=WFS' +
        '&version=1.0.0' +
        '&request=GetFeature' +
        '&typeName=bike:lightpoint' +
        '&srsName=EPSG:4326' +
        '&outputFormat=application/json' +
        '&bbox=' + extent.join(',') + ',EPSG:3857';
    },
    strategy: bboxStrategy
  });
  // let lightCluster = new Cluster({
  //   source: lightPoint,
  //   distance: 50
  // });
  let lightLayer = new VectorLayer({
    source: lightPoint,
    visible: false,
    title: 'lightLayer',
    style: new Style({
      image: new Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        scale: 1.3,
        src: lightP,
      })
    })
  });

  // toiletTest(화장실) WFS Layer
  let toiletTest = new Vector({
    format: new GeoJSON(),
    url: extent => {
      return process.env.VUE_APP_GEOSERVER_URI + '/ows?' +
        'service=WFS' +
        '&version=1.0.0' +
        '&request=GetFeature' +
        '&typeName=bike:toiletpoint' +
        '&srsName=EPSG:4326' +
        '&outputFormat=application/json' +
        '&bbox=' + extent.join(',') + ',EPSG:3857';
    },
    strategy: bboxStrategy
  });
  // let toiletCluster = new Cluster({
  //   source: toiletTest,
  //   distance: 50
  // });
  let toiletLayer = new VectorLayer({
    source: toiletTest,
    visible: false,
    title: 'toiletLayer',
    style: new Style({
      image: new Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        scale: 1.3,
        src: toiletP,
      })
    })
  });
  let wfsLayerGroup = new Group ({
    layers: [
      bikeLineLayer, injeungLayer, rentalLayer, lightLayer, toiletLayer
    ]
  })
  map.addLayer(wfsLayerGroup);

  // 레이어 on/off 체크박스 버튼 부분
  for(let layerGroupElement of $('.checkbox')) {
    layerGroupElement.addEventListener('change', function(){
      let layerGroupElementChecked = this.checked;
      let layerGroupElementValue = this.value;
      if(layerGroupElementChecked == true) {
        layerGroupElement.visible = layerGroupElementChecked;
        wfsLayerGroup.getLayers().forEach(function(element){
          if(element.get('title') == layerGroupElementValue) {
            element.setVisible(layerGroupElementChecked)
          }
        })
      } else {
        wfsLayerGroup.getLayers().forEach(function(element){
          if(element.get('title') == layerGroupElementValue) {
            element.setVisible(layerGroupElementChecked)
          }
        })
      }
    })
  }

  // 현재위치 얻는 부분
  let view = new View({
    center: [0 , 0],
    zoom: 2
  });
  let geolocation = new Geolocation({
      trackingOptions: {
          enableHighAccuracy: true
      },
      projection: view.getProjection()
  });
  geolocation.setTracking(true);
  geolocation.on('error', function(error) {
      console.log('geolocation error: ' + error.message);
  });
  geolocation.on('change:position', function() {
      let coordinates = geolocation.getPosition();
      positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
  });
  let positionFeature = new Feature();
  positionFeature.setStyle(new Style({
      image: new CircleStyle({
          radius: 6,
          fill: new Fill({
              color: 'rgba(255, 0, 0)'
          }),
          stroke: new Stroke({
              color: '#fff',
              width: 2
          })
      })
  }));
  new VectorLayer({
    map: map,
    source: new Vector({
        features: [positionFeature]
    })
  });

  // 자전거길 layer 하이라이트 부분
  const highlightLineStyle = new Style({
    stroke: new Stroke({
      color: 'rgba(255, 255, 255, 0.7)',
      width: 5,
    }),
  });
  const highlightCircleStyle = new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.7)',
      width: 5,
    }),
    stroke: new Stroke({
      color: 'rgba(255, 255, 255, 0.7)',
      width: 5,
    }),
  });
  const featureOverlay = new VectorLayer({
    source: new Vector(),
    map: map,
    style: [highlightLineStyle, highlightCircleStyle],
  });
  let highlight;
  const displayFeatureInfo = function (pixel) {
    $('#text').empty();
    bikeLineLayer.getFeatures(pixel).then(function (features) {
      const feature = features.length ? features[0] : undefined;
      if (feature !== highlight) {
        if (highlight) {
          featureOverlay.getSource().removeFeature(highlight);
        }
        if (feature) {
          featureOverlay.getSource().addFeature(feature);
        }
        highlight = feature;
      }
    });
  };

  // 마우스가 레이어 위에 있을때 하이라이트 되는 부분
  map.on('pointermove', function (evt) {
    if (evt.dragging) {
      return;
    } 
    const pixel = map.getEventPixel(evt.originalEvent);
    displayFeatureInfo(pixel);
    map.getTargetElement().style.cursor = map.hasFeatureAtPixel(evt.pixel) ? 'pointer' : '';
  });

  // 자전거길 layer 클릭시 팝업창 띄우는 부분
  map.on('singleclick', function (evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      return feature;
    });
    $('#popup-content').empty();

    if (feature) {
      console.log('true');
      if (feature.get('구분') == 'BikeLine' ) {
        const coordinate = evt.coordinate;
        let area = feature.get('areaname');
        $.ajax({
          url:`https://api.openweathermap.org/data/2.5/weather?q=${area}&appid=3286e1d0641472a3bf3eaf032d05e804&units=metric`,
          dataType: 'json',
          type: 'GET',
          success: function(data) {
            let temp = Math.floor(data.main.temp) + "º";
            let city = data.name;
            let humidity = data.main.humidity;
            let weather = data.weather[0].main;
            let wind = data.wind.speed;
            let clouds = data.clouds.all + "%"
            $('#popup-content').append('<p>' + feature.get('l_name') + '</p>' + '<br>' + '총 길이: ' + feature.get('totalleng') + " Km" + '<br>' 
                                        + '지역: ' + city + '<br>' + '온도: ' + temp + '<br>' + '습도: ' + humidity + '<br>' 
                                        + '날씨: ' + weather + '<br>' + '바람: ' + wind + '<br>' + '구름: ' + clouds + '<br>');
            overlay.setPosition(coordinate);
          }
        })
        map.getView().fit(feature.getGeometry(), {duration: 1000, padding: [200, 200, 200, 100]} )
      } else if(feature.get('구분') == 'injeungPoint'){
        const coordinate = evt.coordinate;
        $('#popup-content').append('<p>' + feature.get('name') + '</p>' + '<br>' + '주소: ' + feature.get('juso_2') + '<br>');
        overlay.setPosition(coordinate);
        map.getView().fit(feature.getGeometry(), {duration: 1000, padding: [500, 500, 500, 500], minResolution: 2} )
      } else if(feature.get('구분') == 'rentalPoint'){
        const coordinate = evt.coordinate;
        $('#popup-content').append('<p>' + feature.get('name') + '</p>' + '<br>' + '소재지: ' + feature.get('juso2') + '<br>' 
                                    + '휴일: ' + feature.get('holiday') + '<br>'  + '이용료: ' + feature.get('fee_classi') + '<br>' );
        overlay.setPosition(coordinate);
        map.getView().fit(feature.getGeometry(), {duration: 1000, padding: [500, 500, 500, 500], minResolution: 2} )
      } else if(feature.get('구분') == 'lightPoint'){
        const coordinate = evt.coordinate;
        $('#popup-content').append('<p>' + feature.get('보안등?') + '</p>' + '<br>' + '소재지: ' + feature.get('소재지2') + '<br>' 
                                    + '관리기관: ' + feature.get('관리') + '<br>'  + '관리기관 전화번호: ' + feature.get('관리기') + '<br>' );
        overlay.setPosition(coordinate);
        map.getView().fit(feature.getGeometry(), {duration: 1000, padding: [500, 500, 500, 500], minResolution: 2} )
      } else if(feature.get('구분') == 'toiletPoint'){
        const coordinate = evt.coordinate;
        $('#popup-content').append('<p>' + feature.get('화장실') + '</p>' + '<br>' + '소재지: ' + feature.get('표준신') + '<br>' 
                                    + '관리기관: ' + feature.get('관리기') + '<br>'  + '관리기관 전화번호: ' + feature.get('전화번') + '<br>' 
                                    + '개방시간: ' + feature.get('개방시') + '<br>'  + '구분: ' + feature.get('구분2') + '<br>' );
        overlay.setPosition(coordinate);
        map.getView().fit(feature.getGeometry(), {duration: 1000, padding: [500, 500, 500, 500], minResolution: 2} )
      } 
    } else {
      console.log('false');
    }
  });

  // 팝업창 닫기 버튼 실행 부분
  closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
  };

// 현재위치로 줌 기능 
  $('#current').on('click', function() {
    map.getView().fit(positionFeature.getGeometry(), {duration: 1000, minResolution: 4} )
  })

// 원위치로 줌 기능 
  $('#base').on('click', function() {
    let firstPosition = [14250000, 4280000];
    map.getView().animate({
      center: firstPosition,
      zoom: 7.3,
      duration: 2000});
  })


  // 검색 기능 (자동완성기능 추가)
  $('#search').on('click', function() {
    let inputValue = $('#searchArea').val();
    let getBike = bikeLineLayer.getSource().getFeatures();
    for(let i = 0; i < getBike.length; i++) {
      let gbv = getBike[i].get('l_name')
      if(gbv == (inputValue) ) {
        console.log('검색 성공')
        map.getView().fit(getBike[i].getGeometry(), {duration: 1000, padding: [200, 200, 200, 100]} ) 
        break;
      } else {
        console.log('검색 실패')
      }
    }
  })
  $('#searchArea').keyup(function() {
    let txt = $(this).val();
    if(txt != ''){
      $('#autoMaker').children().remove();
      bikeArray.forEach(function(arg){
        if(arg.name.indexOf(txt) > -1) {
          $('#autoMaker').append(
            $('<div>').text(arg.name)
          );
        }
      });
      //클릭기능 추가
      $('#autoMaker').children().each(function(){
        $(this).click(function(){
          $('#searchArea').val($(this).text());
          $('#autoMaker').children().remove();
        })
      })
    } else{
       $('#autoMaker').children().remove();
    }
  });

  // 자전거길list 선택시 해당 자전거길로 줌 기능 
  $('.bikeList').on('click', 'td', function() {
    let liValue = $(this).text();
    let getBike = bikeLineLayer.getSource().getFeatures();
    for(let i = 0; i < getBike.length; i++) {
      let gbv = getBike[i].get('l_name')
      if(liValue == gbv ) {
        console.log('검색 성공')
        map.getView().fit(getBike[i].getGeometry(), {duration: 1000, padding: [200, 100, 200, 100]} ) 
        break;
      } else {
        console.log('검색 실패')
      }
    }
  })
})
// 범례 on/off 
let sw = 'check';
$('#legend').on('click', function(){
  if(sw == 'check') {
    console.log('hide')
    $('#legendImage').hide();
    sw = '';
  } else {
    console.log('show')
    $('#legendImage').show();
    sw = 'check';
  }
})

// 자전거길List on/off
$('#bikeListBtn').on('change',function(){
  if($('#bikeListBtn').prop('checked')) {
    $('.bikeList').show();
    console.log("show")
  } else{
    $('.bikeList').hide();
    console.log("hide")
  }
})
</script>


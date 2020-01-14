import React from 'react';
import './App.css';
import DeckGL from '@deck.gl/react';
import { FlyToInterpolator } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer, LineLayer } from '@deck.gl/layers';
import { Table } from 'apache-arrow';
import Select from 'react-select';
var initSqlJS = require('sql.js');

const initialViewState = {
  longitude: -73.99,
  latitude: 40.69,
  zoom: 10,
  pitch: 0,
  bearing: 0,
}
const hoverDelayToHash = 1000;

export function utf8vectorToAtlas(strings) {
  return ([" ","!","\"","$","&","'","(",")","*","+",",","-",".","/","0","1","2","3","4","5","6","7","8","9",":",";","=","?","@","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","`","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","~","«","°","³","´","·","º","»","½","À","Á","Â","Ä","Å","Æ","Ç","È","É","Ì","Í","Î","Ð","Ñ","Ò","Ó","Ô","Õ","Ö","×","Ø","Ú","Ü","Ý","Þ","ß","à","á","â","ã","ä","å","æ","ç","è","é","ê","ë","ì","í","î","ï","ð","ñ","ò","ó","ô","õ","ö","ø","ù","ú","û","ü","ý","þ","ÿ","Ā","ā","ă","Ą","ą","Ć","ć","Ċ","ċ","Č","č","Ď","ď","Đ","đ","Ē","ē","ĕ","ė","ę","ě","Ğ","ğ","Ġ","ġ","Ģ","ģ","Ħ","ħ","ĩ","Ī","ī","į","İ","ı","Ķ","ķ","Ļ","ļ","Ľ","ľ","Ł","ł","ń","Ņ","ņ","Ň","ň","ŋ","Ō","ō","ŏ","Ő","ő","Œ","œ","ŕ","Ř","ř","Ś","ś","ŝ","Ş","ş","Š","š","Ţ","ţ","Ť","ť","ũ","Ū","ū","ŭ","ů","ű","ų","Ŵ","ŵ","ŷ","Ź","ź","Ż","ż","Ž","ž","Ə","ơ","Ư","ư","ǁ","ǂ","ǃ","ǫ","Ǵ","ǵ","Ș","ș","Ț","ț","ə","ʔ","ʹ","ʻ","ʼ","ʽ","ʿ","̀","́","̄","̨","̱","Π","ά","έ","α","γ","η","ι","λ","ν","ο","ρ","τ","υ","φ","і","ا","ة","ت","ح","ف","ḍ","ḏ","ḥ","ḩ","Ḱ","ḱ","Ḵ","ḵ","Ḷ","ḷ","ḻ","ṇ","ṟ","ṣ","ṭ","ṯ","ẁ","Ẕ","ạ","Ả","ả","Ấ","ấ","ầ","ẩ","ẫ","ậ","ắ","ằ","ẵ","ặ","Ẹ","ẹ","ẻ","ẽ","ế","ề","ể","ễ","ệ","ỉ","ị","ọ","ỏ","ố","ồ","ổ","ỗ","ộ","ớ","ờ","ở","ợ","ụ","ủ","Ứ","ứ","ừ","ử","ữ","ự","ỳ","ỷ","ỹ","–","—","‘","’","“","”","†","•","′","№","−","々","の","ガ","ヒ","モ","ン","人","族","ꞌ"]);
  // cmon champ we don't have four whole seconds to run through over a million strings, this is only 2019, we are but simple people
  // if you do, feel free to comment out that return
  console.log(Date.now());
  const atlas = new Set();
  for(let i = 0 ; i < strings.length; i++ ) {
    const s = strings.get(i);
    for(let j = s.length; j-- > 0 ; ) {
      atlas.add(s[j]);
    }
  }
  const sortedAtlas = Array.from(atlas); sortedAtlas.sort();
  console.log(JSON.stringify(sortedAtlas));
  console.log(Date.now());
  return atlas;
}

const sqlselect = "select rowid from titles where titles match ? order by rowid limit 40";

class App extends React.Component {
  constructor(props) {
    super(props)
    const placeToZoom = decodeURI(window.location.hash.slice(1));
    this.state = {placeToZoom, titleLayers: [], pointLayer: [], searchboxtext: "", viewState: initialViewState, onlyFar: true};
    initSqlJS({locateFile: f => `./${f}`}).then(SQL => {
      fetch("./autocomplete.db").then(resp =>
        resp.arrayBuffer().then(b =>
          this.setState({db: new SQL.Database(new Uint8Array(b))})));
    })
  }
  componentDidMount() {
    const updatepages = (pages) => this.setState({pages, titleLayers: [], pointLayer: [], lng: pages.getColumn('lng').toArray(), lat: pages.getColumn('lat').toArray(), title: pages.getColumn('title'), characterSet: utf8vectorToAtlas(pages.getColumn('title'))});
    Table.from(fetch("./pages.noindex.arrow")).then(p => updatepages(p));
    Table.from(fetch("./topsFarPacked20.noindex.arrow")).then(farsims => this.setState({farsims}))
    Table.from(fetch("./topsPacked20.noindex.arrow")).then(allsims => this.setState({allsims}))
  }
  render() {
    if(this.state == null) {
      return (<h1>loading very soon!</h1>);
    }
    let layers = [];
    const { pages, lng, lat, title, characterSet, pagepick, allsims, farsims, onlyFar, titleLayers, pointLayer, db, placeToZoom, finishedZoomOnLoad } = this.state;
    const sims = onlyFar ? farsims : allsims;
    if(pages != null) {
      if(db && lat && lng && title && placeToZoom !== null) {
        const firstSuggestion = inputToLabelledIds({db, title, input: placeToZoom}).find(({label}) => label === placeToZoom);
        if(!firstSuggestion) {
          this.setState({placeToZoom: null, finishedZoomOnLoad: true});
        } else {
          const initialMove = this.zoomTo({pageIndex: firstSuggestion.value, anchor: placeToZoom});
          initialMove.viewState.onTransitionEnd = () => this.setState({finishedZoomOnLoad: true});
          this.setState({...initialMove, placeToZoom: null});
        }
      }
      const maxtitles = 250000;
      const titleid = `titles${pages.count()}`;
      // performance SIGNIFICANTLY increases for a million points and strings
      // when you reuse the same objects every render call
      // when reusing text and making new points, the perf drops from 10fps to 1fps
      // making new text takes about a minute so that is a nonstarter
      // TODO: optimize TextLayer to be able to render a million strings into GPU buffers for 20M multi-icons
      // between not rendering two passes of foreground and background for the multi-icon sprite sheet, and halving the precision on all of the float buffers (16-bit for most, 32-bit for positions over which text is going), and maybe saving some room at the bottom of the sprite sheet for a large blank background around all text as 1.2M sprites to rasterize at the beginning, it would be possible to build on the existing functionality, but, not today.
      if(!!titleLayers && db && titleLayers.length === 0 && finishedZoomOnLoad) {
        titleLayers.unshift(null); // close the latch
        const dlng = 10000;
        const dlat = dlng/2;
        const didx = (longitude,latitude) => Math.round((dlng-1)/(longitude+180))*dlat+Math.round((dlat-1)/(latitude+90));
        const density = new Float32Array(dlat * dlng);
        const rankInDensity = Float32Array.from({length: maxtitles}, (v,i) => ++density[didx(lng[i],lat[i])] );
        titleLayers.push(new TextLayer({
          id: `${titleid}`,
          data: {length: maxtitles}, // I *think* you get O(n^2) behavior by copying buffers around to make them contiguous if you do an  async iterable like using rangeInChunksOf({max: maxtitles, chunkSize: 1000}),
          pickable: true,
          onHover: ({index, picked}) => this.setState({pagepick: picked ? maxtitles - 1 - index + 1 : null}),
          characterSet,
          backgroundColor: [255,230,170],
          getText: (d,{index}) => `  ${title.get(maxtitles - 1 - index)}  `,
          getSize: (d,{index}) => Math.max(8.57, 1024 * 1024 * 32 / Math.pow(maxtitles - 1 - index + 4, 0.75) / Math.log1p(Math.pow(rankInDensity[maxtitles - 1 - index], 30) * Math.pow(Math.min(100*(maxtitles-index),density[didx(lng[maxtitles - 1 - index],lat[maxtitles - 1 - index])]),1.5))),
          sizeMaxPixels: 30,
          sizeUnits: 'meters',
          wrapLongitude: true,
          fontFamily: '"Roboto Slab"',
          getPosition: (d, {index,target}) => {
            target[0] = lng[maxtitles - 1 - index];
            target[1] = lat[maxtitles - 1 - index];
            return target;
          },
        }));
        this.setState({maxtitles});
      }
      if(!!pointLayer && pointLayer.length === 0) {
        pointLayer.push(new ScatterplotLayer({
          id: `points-${lng.length}`,
          data: {length: lng.length},
          pickable: true,
          onHover: ({index, picked}) => { this.setState({pagepick: !picked ? null : lng.length - 1 - index + 1 }); },
          radiusMinPixels: 2,
          radiusMaxPixels: 20,
          getRadius: 10,
          wrapLongitude: true,
          getPosition: (object, {index,data,target}) => {
            target[0] = lng[lng.length - 1 - index];
            target[1] = lat[lng.length - 1 - index];
            return target;
          },
          getFillColor: [100,100,50],
          getLineColor: [0,0,0],
        }));
      }
      if(!!titleLayers && !!pointLayer) { layers.push(...pointLayer, ...titleLayers) }
      if(!!pagepick && !!sims) {
        const pagepickcoords = [lng[pagepick - 1], lat[pagepick - 1]];
        if(!Number.isFinite(pagepickcoords[0]) || !Number.isFinite(pagepickcoords[1])) {
          console.log(`pagepick ${pagepick}, pagepickcoords ${JSON.stringify(pagepickcoords)}`);
        }
        const pagesims = Array.from(sims.get(pagepick).values()).filter(n => n > 0);
        pagesims.sort((a,b) => (b & 255) - (a & 255));
        const {context: {viewport}} = pointLayer[0];
        const pagesimlats = pagesims.map(p => lat[(p >> 8) - 1]);
        const pagesimlngs = pagesims.map(p => lng[(p >> 8) - 1]);
        const pagesimrgbs = pagesims.map(p => [Math.max(0, 255 - 5 * (p & 255)), Math.min(2 * (p & 255), 255), Math.min(5 * (p & 255),255)]);
        const [sourceX, sourceY] = viewport.project(pagepickcoords);
        const pagesimangles = pagesims.map((p,i) => {
          const [targetX, targetY] = viewport.project([pagesimlngs[i], pagesimlats[i]]);
          return Math.atan2(sourceY - targetY, targetX - sourceX) * 180 / Math.PI;
        });
        const shimFromCenter = Array.from({length: 50}).join(" ");
        const simlines = new LineLayer({
          id: `line-layer-${pagepick}`,
          data: pagesims,
          getWidth: 20,
          getSourcePosition: pagepickcoords,
          getTargetPosition: (d,{index}) => [pagesimlngs[index], pagesimlats[index]],
          getColor: (d,{index}) => pagesimrgbs[index],
        });
        layers.push(simlines);
        const monochromesimtexts = new TextLayer({
          id: `text-layer-${pagepick}`,
          data: {length: pagesims.length + 1},
          characterSet,
          backgroundColor: [234,255,234],
          fontFamily: '"Roboto Slab"',
          getSize: 30,
          getPosition: pagepickcoords,
          getAngle: ((d,{index}) => index === pagesims.length ? 0 : pagesimangles[index]),
          getTextAnchor: ((d,{index}) => index === pagesims.length ? 'middle' : 'start'),
          getColor: ((d, {index}) => index === pagesims.length ? [0,0,0] : pagesimrgbs[index]),
          getText: ((d, {index}) => index === pagesims.length ? `    ${title.get(pagepick-1)}    ` : `${shimFromCenter}${title.get((pagesims[index] >> 8) - 1)}  `),
        });
        layers.push(monochromesimtexts);
        setTimeout(() => {
          if(pagepick === this.state.pagepick) { window.location.hash = title.get(pagepick-1) }
        }, hoverDelayToHash);
      }
      if(!pagepick && finishedZoomOnLoad && window.location.hash.length > 1) {
        setTimeout(() => {
          if(this.state.pagepick === null) { window.location.hash = "" }
        }, hoverDelayToHash)
      }
    }
    const autocompleteIsDisabled = !(db && title);
    return (
    <div>
      <div id="colophon">© Lee Butterman 2020. Made in Oakland, California.</div>
      <div id="searchresults">
        <div>
          {lng ? `${lng.length} places. ` : "Loading places. "}
          {sims ? "" : "Loading similarities. "}
          {this.state.maxtitles ? "" : "Adding place labels. "}
        </div>
        <br/>
        <div>
          <input id="isfar" type="checkbox" checked={onlyFar} onChange={e => this.setState({onlyFar: e.target.checked})} disabled={!sims} />
          <label htmlFor="isfar"> distant relations only {sims ? "" : "(loading)"} </label>
        </div>
        <Select
          options={ autocompleteIsDisabled ? [] : inputToLabelledIds({db, title, input: this.state.searchboxtext }) }
          value={ this.state.searchboxtext }
          onInputChange={ (searchboxtext) => this.setState({searchboxtext}) }
          onChange={ ({label, value}) => this.setState({...this.zoomTo({pageIndex: value, anchor: label}), searchboxtext: label}) }
          isDisabled={autocompleteIsDisabled}
          placeholder={autocompleteIsDisabled ? 'Loading autocomplete' : 'Search'}
        />
      </div>
      <div>
          <DeckGL viewState={this.state.viewState} controller={true} layers={layers} id={"maincanvas"} onViewStateChange={({viewState}) => this.setState({viewState})} />
      </div>
    </div>);
  }

  zoomTo({pageIndex, anchor}) {
    window.location.hash = anchor;
    return ({
      pagepick: pageIndex + 1,
      viewState: {
        ...this.state.viewState,
        longitude: this.state.lng[pageIndex],
        latitude: this.state.lat[pageIndex],
        zoom: this.state.onlyFar ? 9 : 11,
        transitionDuration: 'auto',
        transitionInterpolator: new FlyToInterpolator(),
        transitionEasing: t => smoothstep(smoothstep(t)),
      }
    })
  }
}

const inputToLabelledIds = ({db,input,title}) => Array.from(inputToRowids({db,input}), i => ({value: i-1, label: title.get(i-1)}));
const inputToRowids = function* ({db,input}) {
  const statement = db.prepare(sqlselect);
  statement.bind([inputToFTSQuery(input)]);
  while (statement.step()) {
    yield statement.getAsObject().rowid;
  }
}
const inputToFTSQuery = (s) => s.toLocaleLowerCase().split(/[^a-z0-9\u0080-\uFFFF]+/).filter(n => n.length > 0).join(' NEAR ') + '*';
const smoothstep = t => 3 * t * t - 2 * t * t * t;

export default App;

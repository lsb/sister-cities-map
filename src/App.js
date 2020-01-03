import React from 'react';
import './App.css';
import DeckGL from '@deck.gl/react';
import { FlyToInterpolator } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer, LineLayer } from '@deck.gl/layers';
import { Table, FloatVector, Utf8Vector } from 'apache-arrow';
var initSqlJS = require('sql.js');

const initialViewState = {
  longitude: -121.88,
  latitude: 37.88, 
  zoom: 10,
  pitch: 0,
  bearing: 0,
}

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

const sqlddl = "create virtual table titles using fts4(content='', title);";
const sqlinsertN = n => `insert into titles (rowid, title) values ${Array.from({length: n}, () => '(?,?)').join(',')}`;
const sqlselect = "select rowid from titles where titles match ? order by rowid limit 40";

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {titleLayers: [], pointLayer: [], searchboxtext: "", viewState: initialViewState};
    initSqlJS({locateFile: f => `./${f}`}).then(SQL => {
      var db = new SQL.Database();
      db.run(sqlddl);
      this.setState({db});
    })
  }
  componentDidMount() {
    // const lngs = [-122.268388,-113.884488,-113.765388];
    // const lats = [  37.793888,  41.318988,  41.218888];
    // const titles = ["Dentelé huitième", "ἥλιοκύλινδροι basecamp"," Ἥλιοκύλινδροι overlook"];
    // const minipages = Table.new([FloatVector.from(Float32Array.from(lngs)), FloatVector.from(Float32Array.from(lats)), Utf8Vector.from(titles)], ['lng','lat','title']);
    const updatepages = (pages) => this.setState({pages, titleLayers: [], pointLayer: [], lng: pages.getColumn('lng').toArray(), lat: pages.getColumn('lat').toArray(), title: pages.getColumn('title'), characterSet: utf8vectorToAtlas(pages.getColumn('title'))});
    //updatepages(minipages);
    Table.from(fetch("/pages.noindex.arrow")).then(p => updatepages(p));
    Table.from(fetch("/topsPacked20.noindex.arrow")).then(sims => this.setState({sims}))
  }
  render() {
    let layers = [];
    if(this.state != null && this.state.pages != null) {
      const { pages, lng, lat, title, characterSet, pagepick, sims, titleLayers, pointLayer, db } = this.state;
      let titleBatchSize = 10;
      const titleBatchSizeMax = 100000;
      const maxtitles = 1; // or maybe lng.length;
      const titleid = `titles${pages.count()}`;
      // performance SIGNIFICANTLY increases for a million points and strings
      // when you reuse the same objects every render call
      // when reusing text and making new points, the perf drops from 10fps to 1fps
      // making new text takes about a minute so that is a nonstarter
      if(!!titleLayers && titleLayers.length === 0 && !!db) {
        titleLayers.unshift(null); // close the latch
        console.log('close the latch');
        const mkBatch = (offset) => new TextLayer({
          id: `${titleid}-${offset}`,
          data: {length: Math.min(lng.length - offset, titleBatchSize)},
          pickable: !true,
          onHover: ({index}) => this.setState({pagepick: offset+index+1}),
          characterSet,
          backgroundColor: [255,255,155],
          getText: (object, {index}) => title.get(offset + index),
          getSize: (object, {index}) => Math.max(10, 1024 * 1024 * 64 / Math.pow(offset + index + 1, 1.1)),
          sizeMaxPixels: 20,
          sizeUnits: 'meters',
          fontSettings: {buffer: 5},
          wrapLongitude: true,
          getPosition: (object, {index,data,target}) => {
            target[0] = lng[offset + index];
            target[1] = lat[offset + index];
            target[2] = 0; //1024.0 * 1024.0 / (offset + index + 1); // bug: this does not effect textlayer overlaps
            return target;
          },
          parameters: {depthTest: true},
        });
        const timeoutTick = () => new Promise(r => setTimeout(r,1000));
        const oneTick = () => new Promise(r => setTimeout(r, 0));
        (async () => {
          for(let i = 0; i < maxtitles;) {
            console.log(`batch ${i}`);
            const batch = mkBatch(i);
            const sleep1 = await timeoutTick();
            titleLayers.unshift(batch);
            this.setState({maxOffset: i+titleBatchSize});
            const sleep2 = await timeoutTick();
            i += titleBatchSize;
            titleBatchSize = Math.min(titleBatchSizeMax, Math.floor(titleBatchSize * 2));
          }
          console.log(titleLayers[titleLayers.length - 2]);
        })();
        (async () => {
          const batchSize = 250;
          const max = lng.length;
          const defaultInsert = db.prepare(sqlinsertN(batchSize));
          console.log('here we go!')
          for(let i = 0; i < max; i+= batchSize ) {
            const starttime = Date.now();
            const insertcount = Math.min(max-i-1, batchSize);
            const insert = insertcount === batchSize ? defaultInsert : db.prepare(sqlinsertN(max-i-1));
            const insertvals = Array.from({length: insertcount*2}, (v,j) => ((j % 2) === 0) ? (i + (j >> 1)) : title.get(i + (j >> 1)) )
            insert.run(insertvals);
            const endtime = Date.now();
            if(i % 100000 === 0) { console.log({insertTiming: endtime - starttime})}
            const sleep1 = await oneTick();
          }
          console.log('everything is in fts4')
        })();
      }
      if(!!pointLayer && pointLayer.length === 0) {
        pointLayer.push(new ScatterplotLayer({
          id: `points-${pages.count()}`,
          data: {length: pages.count()},
          pickable: true,
          onHover: ({index}) => { this.setState({pagepick: index+1}); return true },
          radiusMinPixels: 3,
          radiusMaxPixels: 20,
          getRadius: 10,
          wrapLongitude: true,
          getPosition: (object, {index,data,target}) => {
            target[0] = lng[index];
            target[1] = lat[index];
            target[2] = 1 / (index+1024.0*1024.0);
            return target;
          },
          getFillColor: [0,100,200],
          getLineColor: [0,0,0],
          parameters: {depthTest: true},
        }));
      }
      if(!!titleLayers && !!pointLayer) { layers.push(...pointLayer, ...titleLayers) }
      if(!!pagepick && !!sims) {
        const pagesims = Array.from(sims.get(pagepick).values()).filter(n => n > 0 && (n >> 8) !== pagepick);
        const {context: {viewport}} = pointLayer[0];
        const pagepickcoords = [lng[pagepick - 1], lat[pagepick - 1]];
        const pagesimlats = pagesims.map(p => lat[(p >> 8) - 1]);
        const pagesimlngs = pagesims.map(p => lng[(p >> 8) - 1]);
        const pagesimrgbs = pagesims.map(p => [255 - (p & 255), Math.min(5 * (p & 255),255), Math.min(5 * (p & 255),255)]);
        const [sourceX, sourceY] = viewport.project(pagepickcoords);
        const pagesimangles = pagesims.map((p,i) => {
          const [targetX, targetY] = viewport.project([pagesimlngs[i], pagesimlats[i]]);
          return Math.atan2(sourceY - targetY, targetX - sourceX) * 180 / Math.PI;
        });
        const shimFromCenter = "                    ";
        const simlines = new LineLayer({
          id: `line-layer-${pagepick}`,
          data: pagesims,
          getWidth: 5,
          getSourcePosition: pagepickcoords,
          getTargetPosition: (d,{index}) => [pagesimlngs[index], pagesimlats[index]],
          getColor: (d,{index}) => pagesimrgbs[index],
        });
        const simtexts = pagesims.map((p,i) => new TextLayer({
          id: `text-layer-${pagepick}-${i}`,
          data: {length: 1},
          characterSet,
          backgroundColor: pagesimrgbs[i],
          getText: () => `${shimFromCenter}${title.get((pagesims[i] >> 8) - 1)}`,
          getSize: 20,
          getPosition: pagepickcoords,
          getAngle: pagesimangles[i],
          getTextAnchor: 'start',
        }));
        simtexts.push(new TextLayer({
          id: `this-text-${pagepick}`,
          data: {length: 1},
          characterSet,
          backgroundColor: [255,255,255],
          getText: () => title.get(pagepick - 1),
          getSize: 20,
          getPosition: pagepickcoords,
        }));
        layers.push(simlines);
        layers.push(...simtexts);
      }
    }
    return (
    <div>
      <div id="searchresults">
        <form onSubmit={e => this.handleSearchboxSubmit(e)}>
          <label>
            Find place:&nbsp;
            <input type="text" list="places" autoComplete="off" value={(this.state || {}).searchboxtext} onChange={e => this.handleSearchboxInput(e)} />
            <datalist id="places">{
              Array.from(((this.state || {}).searchresults || (new Map())).keys()).map(s => (
                <option value={s} />
              ))
            }</datalist>
          </label>
          <input type="submit" value="Go" />
        </form>
      </div>
      <div>
          <DeckGL viewState={this.state.viewState} controller={true} layers={layers} id={"maincanvas"} onViewStateChange={({viewState}) => this.setState({viewState})} />
      </div>
    </div>);
  }

  handleSearchboxInput(event) {
    const v = event.target.value;
    this.setState({searchboxtext: v});
    const { db, title } = this.state;
    if(this.state.searchresults && this.state.searchresults.get(v)) {
      // if the current input was in the search results the last time, user probably clicked from the autocomplete, so this is a submit
      setTimeout(() => this.handleSearchboxSubmit(), 0);
      return;
    }
    if(db && title) {
      const searchresults = new Map();
      const statement = db.prepare(sqlselect);
      statement.bind([`${v}*`]);
      while (statement.step()) {
        const rowid = statement.getAsObject().rowid;
        searchresults.set(title.get(rowid), rowid);
      }
      this.setState({searchresults});
    }
  }
  handleSearchboxSubmit(event) {
    if(event) { event.preventDefault(); }
    const { searchboxtext, searchresults, lat, lng } = this.state;
    const id = searchresults.get(searchboxtext);
    if(!!id) {
      this.setState({pagepick: id+1})
      this.setState({viewState: {
        ...this.state.viewState,
        longitude: lng[id],
        latitude: lat[id],
        transitionDuration: '2000',
        transitionInterpolator: new FlyToInterpolator(),
        transitionEasing: t => smoothstep(smoothstep(t)),
      }});
    }
  }
}

const smoothstep = t => 3 * t * t - 2 * t * t * t;

export default App;

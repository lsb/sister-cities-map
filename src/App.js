import React from 'react';
import logo from './logo.svg';
import './App.css';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, TextLayer, LineLayer } from '@deck.gl/layers';
import { Table, FloatVector, Utf8Vector } from 'apache-arrow';

const initialViewState = {
  longitude: -121.88,
  latitude: 37.88, 
  zoom: 8,
  pitch: 0,
  bearing: 0,
}

export function utf8vectorToAtlas(strings) {
  // const start = Date.now();
  // const searchResults = [];
  // const query = /taraval/i;
  // for(let i = 0; i<strings.length; i++) {
  //   if(strings.get(i).match(query)) {
  //     searchResults.push(i)
  //   }
  // }
  // const stop = Date.now();
  // console.log({start, stop, searchResults});
  return [" ","D","a","b","c","e","h","i","k","l","m","n","o","p","r","s","t","u","v","è","é","δ","ι","κ","λ","ν","ο","ρ","ύ","ἥ","Ἥ"].concat([" ","!","\"","$","&","'","(",")","*","+",",","-",".","/","0","1","2","3","4","5","6","7","8","9",":",";","=","?","@","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","`","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","~","«","°","³","´","·","º","»","½","À","Á","Â","Ä","Å","Æ","Ç","È","É","Ì","Í","Î","Ð","Ñ","Ò","Ó","Ô","Õ","Ö","×","Ø","Ú","Ü","Ý","Þ","ß","à","á","â","ã","ä","å","æ","ç","è","é","ê","ë","ì","í","î","ï","ð","ñ","ò","ó","ô","õ","ö","ø","ù","ú","û","ü","ý","þ","ÿ","Ā","ā","ă","Ą","ą","Ć","ć","Ċ","ċ","Č","č","Ď","ď","Đ","đ","Ē","ē","ĕ","ė","ę","ě","Ğ","ğ","Ġ","ġ","Ģ","ģ","Ħ","ħ","ĩ","Ī","ī","į","İ","ı","Ķ","ķ","Ļ","ļ","Ľ","ľ","Ł","ł","ń","Ņ","ņ","Ň","ň","ŋ","Ō","ō","ŏ","Ő","ő","Œ","œ","ŕ","Ř","ř","Ś","ś","ŝ","Ş","ş","Š","š","Ţ","ţ","Ť","ť","ũ","Ū","ū","ŭ","ů","ű","ų","Ŵ","ŵ","ŷ","Ź","ź","Ż","ż","Ž","ž","Ə","ơ","Ư","ư","ǁ","ǂ","ǃ","ǫ","Ǵ","ǵ","Ș","ș","Ț","ț","ə","ʔ","ʹ","ʻ","ʼ","ʽ","ʿ","̀","́","̄","̨","̱","Π","ά","έ","α","γ","η","ι","λ","ν","ο","ρ","τ","υ","φ","і","ا","ة","ت","ح","ف","ḍ","ḏ","ḥ","ḩ","Ḱ","ḱ","Ḵ","ḵ","Ḷ","ḷ","ḻ","ṇ","ṟ","ṣ","ṭ","ṯ","ẁ","Ẕ","ạ","Ả","ả","Ấ","ấ","ầ","ẩ","ẫ","ậ","ắ","ằ","ẵ","ặ","Ẹ","ẹ","ẻ","ẽ","ế","ề","ể","ễ","ệ","ỉ","ị","ọ","ỏ","ố","ồ","ổ","ỗ","ộ","ớ","ờ","ở","ợ","ụ","ủ","Ứ","ứ","ừ","ử","ữ","ự","ỳ","ỷ","ỹ","–","—","‘","’","“","”","†","•","′","№","−","々","の","ガ","ヒ","モ","ン","人","族","ꞌ"]);
  // cmon champ we don't have four whole seconds to run through over a million strings, this is only 2019, we are but simple people
  // if you do, feel free to comment out that return
  // also feel free to uncomment the /taraval/i query above to reaffirm why doing a linear scan through all the strings is not performant enough
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


class App extends React.Component {
  componentDidMount() {
    const lngs = [-122.268388,-113.884488,-113.765388];
    const lats = [  37.793888,  41.318988,  41.218888];
    const titles = ["Dentelé huitième", "ἥλιοκύλινδροι basecamp"," Ἥλιοκύλινδροι overlook"];
    const minipages = Table.new([FloatVector.from(Float32Array.from(lngs)), FloatVector.from(Float32Array.from(lats)), Utf8Vector.from(titles)], ['lng','lat','title']);
    const updatepages = (pages) => this.setState({pages, lng: pages.getColumn('lng').toArray(), lat: pages.getColumn('lat').toArray(), characterSet: utf8vectorToAtlas(pages.getColumn('title'))});
    updatepages(minipages);
    Table.from(fetch("/pages.noindex.arrow")).then(p => updatepages(p));
    Table.from(fetch("/topsPacked20.noindex.arrow")).then(sims => this.setState({sims}))
  }
  render() {
    let layers = [];
    if(this.state != null && this.state.pages != null) {
      const { pages, lng, lat, characterSet, pagepick, sims } = this.state;
      console.log({pagepick})
      const title = pages.getColumn('title');
      const titleid = `titles${pages.count()}`;
      if(!this.state[titleid]) {
        // some text layer linebreaking causes problems
        // when you have millions of strings and keep making layers over and over
        // so breach established norms and cache the layer in the state
        this.setState({
          [titleid]: (new TextLayer({
            id: titleid,
            data: {length: pages.count()},
            pickable: true,
            onHover: ({index}) => this.setState({pagepick: index+1}),
            characterSet,
            backgroundColor: [255,255,155],
            getText: (object, {index}) => title.get(index),
            getSize: (object, {index}) => Math.max(10, 1024 * 1024 * 64 / Math.pow(index + 1, 1.05)),
            sizeMaxPixels: 20,
            sizeUnits: 'meters',
            wrapLongitude: true,
            getPosition: (object, {index,data,target}) => {
              target[0] = lng[index];
              target[1] = lat[index];
              target[2] = 1024.0 * 1024.0 / (index + 1024 * 1024); // bug: this does not effect textlayer overlaps
              return target;
            },
            parameters: {depthTest: true},
          }))
        })
      }
      layers = [
        new ScatterplotLayer({
          id: `points-${pages.count()}`,
          data: {length: pages.count()},
          pickable: false,
          onHover: ({index}) => this.setState({pagepick: index+1}),
          radiusMinPixels: 2,
          radiusMaxPixels: 20,
          wrapLongitude: true,
          getPosition: (object, {index,data,target}) => {
            target[0] = lng[index];
            target[1] = lat[index];
            target[2] = 1024.0 * 1024.0 / (index+1024.0*1024.0);
            return target;
          },
          getFillColor: [0,100,200],
          getLineColor: [0,0,0],
          parameters: {depthTest: true},
        }),
        this.state[titleid],
      ];
      if(!!pagepick && !!sims) {
        const pagesims = Array.from(sims.get(pagepick).values()).filter(n => n > 0 && (n >> 8) !== pagepick);
        const simlines = new LineLayer({
          id: `line-layer-${pagepick}`,
          data: pagesims,
          getWidth: 5,
          getSourcePosition: [lng[pagepick - 1],lat[pagepick - 1]],
          getTargetPosition: d => [lng[(d >> 8) - 1], lat[(d >> 8) - 1]],
          getColor: d => [(d & 255), 255 - (d & 255), 255 - (d & 255)]
        });
        const simtexts = new TextLayer({
          id: `text-layer-${pagepick}`,
          data: pagesims,
          pickable: false,
          characterSet,
          backgroundColor: [255,205,155],
          getText: d => `                ${title.get((d >> 8) - 1)}`,
          getSize: 20,
          getPosition: [lng[pagepick - 1], lat[pagepick -1]],
          getAngle: d => Math.atan2(lat[(d >> 8) - 1] - lat[pagepick - 1], lng[(d >> 8) - 1] - lng[pagepick - 1]) * 180 / Math.PI,
          getTextAnchor: 'start',
        });
        layers.push(simlines);
        layers.push(simtexts);
      }
    }
    return (<div className="App">
      <DeckGL initialViewState={initialViewState} controller={true} layers={layers} id={"maincanvas"} />
    </div>);

  }
}


export default App;

import { useState } from 'react';
import ReactDOM from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { Color } from 'three';
import { IFCViewer } from './ui/screens';
import './index.css';

function App() {
  const [mouseEvent, setMouseEvent] = useState<any>();
  const [ifcURL, setIfcUrl] = useState('');

  function readIfcFile(event: any) {
    if (!event) return;
    const objectURL = URL.createObjectURL(event.target.files[0]);
    setIfcUrl(objectURL);
  }

  return (
    <div>
      <input readOnly type="file" onChange={readIfcFile} id="openFileDialog" />
      <div onDoubleClick={setMouseEvent}>
        <Canvas
          dpr={Math.min(window.devicePixelRatio, 2)}
          gl={{ antialias: true }}
          mode="concurrent"
          camera={{
            fov: 45,
            near: 0.1,
            far: 1000,
            position: 5,
            aspect: window.innerWidth / window.innerHeight
          }}
          onCreated={({ scene, setSize }) => {
            setSize(window.innerWidth, window.innerHeight);
            scene.background = new Color(0x8cc7de);
          }}
        >
          <IFCViewer ifcURL={ifcURL} mouseEvent={mouseEvent} />
        </Canvas>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));

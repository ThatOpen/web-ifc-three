import { useThree } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { Raycaster, Vector2, Vector3 } from 'three';
import { OrbitControls, Stats, PerspectiveCamera } from '@react-three/drei';
import { IFCLoader } from '../../../loader/IfcLoader';

const ifcLoader = new IFCLoader();
ifcLoader.setWasmPath('../../');

type IFCViewerProps = { mouseEvent: MouseEvent | undefined; ifcURL: string };

export function IFCViewer({ mouseEvent, ifcURL }: IFCViewerProps) {
  const { camera, scene } = useThree();
  const [ifcMesh, setIfcMesh] = useState<any>();
  const [previousSelection, setPreviousSelection] = useState<number>();

  useEffect(() => {
    if (ifcURL) {
      ifcLoader.load(ifcURL, (geometry: any) => {
        scene.add(geometry);
        setIfcMesh(geometry);
      });
    }
  }, [ifcURL, scene]);

  useEffect(() => {
    function selectObject() {
      const resetDisplayState = { r: 0, g: 0, b: 0, a: 1, h: 0 };
      if (mouseEvent?.button !== 0) return;

      const mouse = new Vector2();
      mouse.x = (mouseEvent?.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(mouseEvent?.clientY / window.innerHeight) * 2 + 1;

      const raycaster = new Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersected = raycaster.intersectObjects(scene.children);
      if (intersected.length) {
        if (previousSelection)
          ifcLoader.setItemsVisibility([previousSelection], ifcMesh, resetDisplayState, scene);

        if (ifcMesh) {
          const item = ifcLoader.pickItem(intersected, ifcMesh.geometry);
          const id = ifcLoader.getExpressId(Number(item.faceIndex));
          setPreviousSelection(id);

          const ifcProject = ifcLoader.getSpatialStructure();
          console.log(ifcProject);

          const properties = ifcLoader.getItemProperties(id, false, false);
          console.log(properties);

          const state = { r: 0, g: 0, b: 1, a: 0.2, h: 1 };
          ifcLoader.setItemsVisibility([id], ifcMesh, state, scene);
        }
      }
    }

    selectObject();
  }, [mouseEvent, scene, camera, ifcMesh, previousSelection]);

  return (
    <>
      <Stats showPanel={0} className="stats" />
      <OrbitControls camera={camera} />
      <PerspectiveCamera position={new Vector3(0, 0, 10)} />
      <directionalLight color={0xffeeff} intensity={0.8} position={new Vector3(1, 1, 1)} />
      <directionalLight color={0xffffff} intensity={0.8} position={new Vector3(-1, 0.5, -1)} />
      <ambientLight color={0xffffee} intensity={0.25} />
    </>
  );
}

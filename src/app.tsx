import {
  batch,
  Signal,
  signal,
  useComputed,
  useSignal,
  useSignalEffect,
} from "@preact/signals";
import { Ref, useCallback, useEffect, useRef, useState } from "preact/hooks";
import { JSXInternal } from "preact/src/jsx";

type ListItemTemplate = {
  name: string;
  lastname: string;
};
type ListItem = ListItemTemplate & {
  id: number;
};

const possibleNames: ListItemTemplate[] = [
  { name: "Marko", lastname: "Jerkić" },
  { name: "Antonela", lastname: "Jerkić" },
];

const generateRandomName = (): ListItem => {
  let random = possibleNames[Math.floor(Math.random() * possibleNames.length)];

  while (!random) {
    random = possibleNames[Math.floor(Math.random() * possibleNames.length)];
  }

  return { ...random, id: Math.random() * 1000 };
};

const ListItem = (props: { item: ListItem }) => {
  //console.log('item', props.item.id)
  return <p>{`${props.item.lastname}, ${props.item.name}`}</p>;
};

type NodeRef<TProps> = { ref: Ref<JSXInternal.Element> | null; props: TProps };
const For = <TProps,>({
  children: Child,
  signalArray,
}: {
  children: (props: TProps) => JSXInternal.Element;
  signalArray: Signal<TProps[]>;
}) => {
  const refs = useSignal<NodeRef<TProps>[]>(signalArray.value.map(item => ({ props: item, ref: null })));
  console.log('rerender for')

  useSignalEffect(() => {
    const signalArrayCopy = signalArray.value;
    const refsCopy = refs.value;
    for (let [index, childItemProp] of signalArrayCopy.entries()) {
      let nodeValue = refs.value[index];
      if (nodeValue) {
        if (nodeValue.props !== signalArrayCopy[index]) {
          refsCopy[index]!.props = childItemProp;
        }
      } else {
        nodeValue = { props: childItemProp, ref: null };
        refsCopy.push(nodeValue);
      }
    }

    refs.value = refsCopy;
  });

  return (
    <div>
      {refs.value.map(({ ref, props }) => {
        return <Child key={ref} ref={ref} {...props} />;
      })}
    </div>
  );
};

const ForSignal = () => {
  const items = useSignal<ListItem[]>([
    generateRandomName(),
    generateRandomName(),
  ]);

  console.count("rerender signal");

  return (
    <div class="space-y-2">
      <For signalArray={items}>{(item) => <ListItem item={item} />}</For>
      <button
        class="bg-fuchsia-800 rounded-lg p-1"
        onClick={() => (items.value = [...items.value, generateRandomName()])}
      >
        Add new name to the list
      </button>
    </div>
  );
};

const ForState = () => {
  //incrementCount("state")();
  const [items, setItems] = useState<ListItem[]>([
    generateRandomName(),
    generateRandomName(),
  ]);

  const addNewName = useCallback(() => {
    setItems([...items, generateRandomName()]);
  }, [setItems, items]);

  console.count("rerender state");

  return (
    <div class="space-y-2">
      {items.map((item) => (
        <ListItem key={item.id} item={item} />
      ))}
      <button class="bg-fuchsia-800 rounded-lg p-1" onClick={addNewName}>
        Add new name to the list
      </button>
    </div>
  );
};

const rerenderCountSignal = signal(0);
const rerenderCountState = signal(0);

const incrementCount = (count: "signal" | "state") => () => {
  if (count === "signal") {
    if (rerenderCountSignal.value < 10) {
      rerenderCountSignal.value++;
    }
  } else if (count === "state") {
    if (rerenderCountState.value < 10) {
      rerenderCountState.value++;
    }
  }
};

/*
const TestRender = () => {
  const testComp = useSignal(<p>prvi render</p>);
  const ref = useRef<HTMLElement | HTMLDivElement>(null);

  useSignalEffect(() => {
    const t = ref.current;
    if (!!t) {
      //ref.cu = testComp.value.ref;
    }
  });

  useSignalEffect(() => {
    const i = setInterval(() => {
      testComp.value = <p>{Math.random()}</p>;
    }, 1000);
    return () => clearInterval(i);
  });

  return <div ref={ref as any}>{testComp.value}</div>;
};
  */

export function App() {
  console.log("rerender app");

  return (
    <div class="bg-zinc-800 grid grid-cols-2 content-start gap-2 place-content-center w-full h-full min-h-screen text-white p-4">
      {/*
      <TestRender />
*/}
      <p class="border border-white p-2 max-w-fit">
        State rerendered: {rerenderCountState}
      </p>
      <p class="border border-white p-2 max-w-fit">
        Signal rerendered: {rerenderCountSignal}
      </p>
      <ForState />
      <ForSignal />
    </div>
  );
}

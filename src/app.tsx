import {
  batch,
  Signal,
  signal,
  useComputed,
  useSignal,
  useSignalEffect,
} from "@preact/signals";
import { h, hydrate, render } from "preact";
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

const ListItem = (props: { item: ListItem; remove: () => void }) => {
  return (
    <div class="flex flex-row justify-between space-y-2 max-w-2">
      <p>{`${props.item.id} - ${props.item.lastname}, ${props.item.name}`}</p>
      <button class="bg-fuchsia-500 p-2 rounded-md" onClick={props.remove}>
        Remove me
      </button>
    </div>
  );
};

const For = <TProps,>({
  children,
  signalArray,
  className,
  class: clazz,
}: {
  children: (props: TProps) => JSXInternal.Element;
  signalArray: Signal<TProps[]>;
  className?: string;
  class?: string;
}) => {
  console.count("for reredner");
  const parentRef = useRef<HTMLElement>(null);

  useSignalEffect(() => {
    const eachChildren = signalArray.value.map((props) => (
      <>{children(props)}</>
    ));
    console.log("children count", signalArray.value.length);
    if (parentRef.current) {
      //hydrate(eachChildren, parentRef.current);
      render(
        eachChildren,
        parentRef.current,
        parentRef.current.children as unknown as Element
      );
    }
  });

  return <div class={clazz ?? className} ref={parentRef as any} />;
};

const ForSignal = () => {
  const items = useSignal<ListItem[]>([
    generateRandomName(),
    generateRandomName(),
  ]);

  console.count("rerender signal");

  return (
    <div class="space-y-2">
      <For signalArray={items}>
        {(item) => (
          <ListItem
            item={item}
            remove={() =>
              (items.value = items.value.filter((i) => i.id !== item.id))
            }
          />
        )}
      </For>
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
        <ListItem
          key={item.id}
          item={item}
          remove={() => setItems(items.filter((i) => i.id !== item.id))}
        />
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

const TestRender = () => {
  console.count("test rerender");
  const testComp = useSignal([1, 2, 3, 4]);
  const parentRef = useRef<HTMLElement | HTMLDivElement>(null);

  useSignalEffect(() => {
    const i = setInterval(() => {
      testComp.value = [
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
      ];
    }, 1000);
    return () => clearInterval(i);
  });

  useSignalEffect(() => {
    const items = testComp.value.map((i) => <div>{i}</div>);
    if (parentRef.current) {
      hydrate(items, parentRef.current);
    }
  });

  return <div ref={parentRef as any} class="bg-violet-600 p-2"></div>;
};

export function App() {
  console.log("rerender app");

  return (
    <div class="bg-zinc-800 grid grid-cols-2 content-start gap-2 place-content-center w-full h-full min-h-screen text-white p-4">
      {/*<TestRender /> */}
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

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
    if (parentRef.current) {
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
  incrementCount("signal")();
  const items = useSignal<ListItem[]>([
    generateRandomName(),
    generateRandomName(),
  ]);

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
  incrementCount("state")();
  const [items, setItems] = useState<ListItem[]>([
    generateRandomName(),
    generateRandomName(),
  ]);

  const addNewName = useCallback(() => {
    setItems([...items, generateRandomName()]);
  }, [setItems, items]);

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
let rerenderCountSignalV = { count: 0 };
let rerenderCountSignalProxy = new Proxy(rerenderCountSignalV, {
  set: (target: any, property: any, value: any, _: any) => {
    rerenderCountSignal.value = value;
    target[property] = value;
    return true;
  },
});
const rerenderCountState = signal(0);
let rerenderCountStateV = {count: 0};
let rerenderCountStateProxy = new Proxy(rerenderCountStateV, {
  set: (target: any, property: any, value: any, _: any) => {
    rerenderCountState.value = value;
    target[property] = value;
    return true;
  },
});

const incrementCount = (count: "signal" | "state") => () => {
  if (count === "signal") {
    rerenderCountSignalProxy.count++;
  } else if (count === "state") {
    rerenderCountStateProxy.count++
  }
};

export function App() {
  console.log("rerender app");

  return (
    <div class="bg-zinc-800 grid grid-cols-2 content-start gap-2 place-content-center w-full h-full min-h-screen text-white p-4">
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

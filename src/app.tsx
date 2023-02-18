import {
  Signal,
  signal,
  useComputed,
  useSignal,
} from "@preact/signals";
import { useCallback, useState } from "preact/hooks";
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
  const random = Math.floor(Math.random() * possibleNames.length);

  return { ...possibleNames[random], id: Math.random() * 1000 };
};

const ListItem = ({ item: { lastname, name } }: { item: ListItem }) => {
  return <p>{`${lastname}, ${name}`}</p>;
};

const For = <TProps,>({
  children,
  signalArray,
}: {
  children: (props: TProps) => JSXInternal.Element;
  signalArray: Signal<TProps[]>;
}) => {
  console.count("rerender for component");
  const array = useComputed(() =>
    signalArray.value.map((props) => {
      return <>{children(props)}</>;
    })
  );
  return <>{array}</>;
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
  console.count("rerender: ", count);
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

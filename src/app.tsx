import {
  computed,
  Signal,
  signal,
  useComputed,
  useSignal,
  useSignalEffect,
} from "@preact/signals";
import { hydrate, options, render } from "preact";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { JSXInternal } from "preact/src/jsx";
import {
  AugmentedComponent,
  HookFn,
  OptionsTypes,
} from "@preact/signals/src/internal";

type ListItemTemplate = {
  name: string;
  lastname: string;
};
type ListItem = ListItemTemplate & {
  id: number;
};

const possibleNames: ListItemTemplate[] = [
  { name: "Ivan", lastname: "Jerkić" },
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
  const id = useId();
  console.log(
    "rerender",
    `${id}->${Math.floor(props.item.id)} - ${props.item.lastname}, ${
      props.item.name
    }`
  );
  return (
    <div class="flex flex-row bg-zinc-800 justify-between space-y-2 max-w-2">
      <p>{`${id}->${Math.floor(props.item.id)} - ${props.item.lastname}, ${
        props.item.name
      }`}</p>
      <button class="bg-fuchsia-500 p-2 rounded-md" onClick={props.remove}>
        Remove me
      </button>
    </div>
  );
};

const HAS_COMPUTEDS = 1 << 2;
/**
 * A wrapper component that renders a Signal directly as a Text node.
 * @todo: in Preact 11, just decorate Signal with `type:null`
 */
function SignalNode(this: AugmentedComponent, { data }: { data: Signal }) {
  // hasComputeds.add(this);

  // Store the props.data signal in another signal so that
  // passing a new signal reference re-runs the text computed:
  const currentSignal = useSignal(data);
  currentSignal.value = data;

  const s = useMemo(() => {
    // mark the parent component as having computeds so it gets optimized
    let v = this.__v;
    while ((v = v.__!)) {
      if (v.__c) {
        v.__c._updateFlags |= HAS_COMPUTEDS;
        break;
      }
    }

    // Replace this component's vdom updater with a direct text one:
    if (this._updater) {
      this._updater._callback = () => {
        (this.base as Element) = s.peek();
      };
    }

    return computed(() => {
      let data = currentSignal.value;
      let s = data.value;
      return s === 0 ? 0 : s === true ? <></> : s || <></>;
    });
  }, []);

  return s.value;
}
SignalNode.displayName = "_sn";

Object.defineProperties(Signal.prototype, {
  constructor: { configurable: true, value: undefined },
  type: { configurable: true, value: SignalNode },
  props: {
    configurable: true,
    get() {
      return { data: this };
    },
  },
  // Setting a VNode's _depth to 1 forces Preact to clone it before modifying:
  // https://github.com/preactjs/preact/blob/d7a433ee8463a7dc23a05111bb47de9ec729ad4d/src/diff/children.js#L77
  // @todo remove this for Preact 11
  __b: { configurable: true, value: 1 },
});

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

  /*
  useSignalEffect(() => {
    const eachChildren = signalArray.value.map((props) => (
      <>{children(props)}</>
    ));
    if (parentRef.current) {
      for (let [index, child] of Array.from(
        parentRef.current.childNodes
      ).entries()) {
        let currentChildAtIndex = eachChildren[index];
        if (currentChildAtIndex) {
          currentChildAtIndex.props;
        }
        //console.log("child", child);
      }
      hydrate(eachChildren, parentRef.current);
      //render(
      //  eachChildren,
      //  parentRef.current,
      //  parentRef.current.children as unknown as Element
      //);
    }
  });
*/
  const compoutedChildren = useComputed(() => {
    console.log("compute");
    return signalArray.value.map((props) => <>{children(props)}</>);
  });

  return <>{compoutedChildren}</>;
  //return <div class={clazz ?? className} ref={parentRef as any} />;
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
let rerenderCountStateV = { count: 0 };
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
    rerenderCountStateProxy.count++;
  }
};

const Couter = () => {
  const count = useSignal(0);
  useSignalEffect(() => {
    const i = setInterval(() => count.value++, 1000);
    return () => clearInterval(i);
  });

  return <>{count}</>;
};

export function App() {
  //console.log("rerender app");

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

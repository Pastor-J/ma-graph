import { createContext } from "react";

// In order to accept changes and analyze data, all component nodes need to be able to access the functions onAccept and onAnalyze. You can pass these functions via the data prop of the nodes. However this will lead to bugs, as these functions are never truly up to date. The context provider allows to "provide" these functions to all component nodes without causing issues.

export const NodeContext = createContext(undefined);

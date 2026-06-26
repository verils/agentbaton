export type Screen =
  | { type: 'main' }
  | { type: 'agentSelect' }
  | { type: 'agentDetail'; agentId: string }
  | { type: 'chooseProvider'; agentId: string }
  | { type: 'confirmProviderSwitch'; agentId: string; providerId: string }
  | { type: 'promptChooseModel'; agentId: string }
  | { type: 'chooseModel'; agentId: string }
  | { type: 'addProviderBinding'; agentId: string }
  | { type: 'removeProviderBinding'; agentId: string }
  | { type: 'providerSelect' }
  | { type: 'addProvider'; returnTo?: Screen }
  | { type: 'modifyProvider'; providerId: string };

export type NavProps = {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  goToMainMenu: () => void;
  exit: () => void;
};

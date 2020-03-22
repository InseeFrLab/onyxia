import * as types from "./../actions/constantes";

export const SMALL_POINT = 600;
export const MEDIUM_POINT = 960;
export const LARGE_POINT = 1280;

const initial = {
  authenticated: false,
  authenticationError: null,
  requestError: null,
  redirectUri: null,
  waiting: false,
  displayLogin: false,
  screenWidth: 0,
  screenType: null,
  visite: false,
  faviconUrl: "/onyxia.png",
  accueil: null
};

export default (state = initial, action) => {
  switch (action.type) {
    case types.SET_AUTHENTICATED: {
      return {
        ...state,
        authenticated: true,
        authenticationError: null
      };
    }
    case types.START_WAITING: {
      return { ...state, waiting: true };
    }
    case types.STOP_WAITING: {
      return { ...state, waiting: false };
    }
    case types.REQUEST_ERROR: {
      return { ...state, requestError: action.payload.error };
    }
    case types.AUTHENTICATED_FAIL: {
      return {
        ...state,
        authenticated: false,
        authenticationError: action.payload.error
      };
    }
    case types.SET_REDIRECT_URI: {
      return { ...state, redirectUri: action.payload.uri };
    }
    case types.DISPLAY_LOGIN: {
      return { ...state, displayLogin: action.payload.display };
    }
    case types.APP_RESIZE: {
      return {
        ...state,
        screenWidth: action.payload.width,
        screenType: getTypePoint(action.payload.width)
      };
    }
    case types.START_VISITE: {
      return { ...state, visite: true };
    }
    case types.STOP_VISITE: {
      return { ...state, visite: false };
    }
    case types.SET_FAVICON: {
      return { ...state, faviconUrl: action.payload.url };
    }

    case types.ACCUEIL_LOAD: {
      return { ...state, accueil: action.payload.accueil };
    }

    default:
      return state;
  }
};

const getTypePoint = width =>
  width < SMALL_POINT
    ? SMALL_POINT
    : width < MEDIUM_POINT
    ? MEDIUM_POINT
    : LARGE_POINT;

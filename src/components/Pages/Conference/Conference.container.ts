import { connect } from "react-redux";
import {
  getAddress,
  isConnecting,
} from "decentraland-dapps/dist/modules/wallet/selectors";
import { isLoggingIn } from "../../../modules/identity/selector";
import { getServer, getToken } from "../../../modules/conference/selector";
import { RootState } from "../../../modules/reducer";
import withRouter from "../../../utils/WithRouter";
import Conference from "./Conference";
import { MapDispatch, MapStateProps, OwnProps } from "./Conference.types";

const mapStateToProps = (
  state: RootState,
  ownProps: OwnProps
): MapStateProps => {
  const addressFromPath = ownProps.router.params.profileAddress;

  return {
    profileAddress: addressFromPath?.toLowerCase(),
    isLoading: isLoggingIn(state) || isConnecting(state),
    loggedInAddress: getAddress(state)?.toLowerCase(),
    server: getServer(state),
    token: getToken(state),
  };
};

const mapDispatch = (_dispatch: MapDispatch): any => ({});

export default withRouter(connect(mapStateToProps, mapDispatch)(Conference));

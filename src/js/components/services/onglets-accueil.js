import React from "react";
import { Link } from "react-router-dom";
import { Grid, Tabs, Tab, IconButton, Icon } from "@material-ui/core";
import { AppBar } from "@material-ui/core";
import {
  CarteService,
  getColorClassStateService
} from "js/components/commons/service-liste";
import {
  getServiceAvatar,
  getTitle,
  getSubtitle
} from "js/components/commons/service-liste";

class OngletsAccueil extends React.Component {
  state = { onglet: 2, slide: true };
  constructor(props) {
    super(props);
    props.chargerServices();
  }

  handleChangeOnglet = (event, onglet) => this.setState({ onglet });

  handleChange = () =>
    this.setState({
      slide: !this.state.slide
    });

  handleOpenService = service =>
    window.open(service.labels.ONYXIA_URL.split(",")[0]);

  handleMoreDetailsService = service =>
    this.props.setServiceSelectionne(service);

  render() {
    const { alpaServices, betaServices, stableServices } = this.props;
    const services =
      this.state.onglet === 0
        ? alpaServices
        : this.state.onglet === 1
        ? betaServices
        : stableServices;
    const gridItems = services.map((service, i) => (
      <CarteService
        down={getColorClassStateService(service) === "down"}
        key={i}
        title={getTitle(service)}
        subtitle={getSubtitle(service)}
        avatar={getServiceAvatar(service)}
        actions={createActionsCarte(service)(this.handleOpenService)(
          this.handleMoreDetailsService
        )}
        contenu={createContenuCarte(service)}
      />
    ));
    return (
      <div className="contenu accueil">
        <AppBar position="static">
          <Tabs
            id="onglets-accueil-services"
            value={this.state.onglet}
            onChange={this.handleChangeOnglet}
          >
            <Tab label="Alpha" onClick={this.handleChange} />
            <Tab label="Beta" onClick={this.handleChange} />
            <Tab label="Stable" onClick={this.handleChange} />
          </Tabs>
        </AppBar>
        <Grid container spacing={8} classes={{ container: "cartes" }}>
          {gridItems}
        </Grid>
      </div>
    );
  }
}

const createContenuCarte = service => () => (
  <div className="paragraphe">
    <div className="titre">Description</div>
    <div className="corps">{service.labels.ONYXIA_DESCRIPTION}</div>
  </div>
);

const createActionsCarte = service => openService => openDetails => () => (
  <React.Fragment>
    <IconButton
      color="secondary"
      aria-label="ouvir"
      onClick={() => openService(service)}
    >
      <Icon>launch</Icon>
    </IconButton>
    <Link to={`/services${service.id}`}>
      <IconButton
        className="more-details"
        color="secondary"
        aria-label="plus de détails"
        onClick={() => openDetails(service)}
      >
        <Icon>more_horiz</Icon>
      </IconButton>
    </Link>
  </React.Fragment>
);

export default OngletsAccueil;

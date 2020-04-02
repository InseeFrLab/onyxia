import React from 'react';
import { Redirect } from 'react-router-dom';

const SecretHome = ({ idep }) => {
	return <Redirect to={`/mes-secrets/${idep}`} />;
};

export default SecretHome;

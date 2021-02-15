import React from 'react';
import { Button, Icon } from '@material-ui/core';
import type { IconTypeMap } from "@material-ui/core";
import Checkbox from '@material-ui/core/Checkbox';
import type { Link } from "type-route";

type Props= {
	linkProps: Link;
	name: string;
	icone: string;
	color?: IconTypeMap["props"]["color"];
	handleCheck?: (e: { target: { checked: boolean; }})=> void;
	checked?: boolean;
	onClick?: ()=> void;
};

export const Ligne: React.FC<Props> = ({
	linkProps,
	name,
	icone,
	color = 'secondary',
	handleCheck,
	checked,
	onClick,
}) => (
	<>
		<div className="entry">
			<a {...linkProps}>
				<Button className="directory" onClick={onClick}>
					<Icon className="icone" color={color}>
						{icone}
					</Icon>
					<span className="texte">{name}</span>
				</Button>

				{checked !== undefined && handleCheck ? (
					<Checkbox
						checked={checked}
						onChange={handleCheck}
						className="select-it"
					/>
				) : null}
			</a>
		</div>
	</>
);


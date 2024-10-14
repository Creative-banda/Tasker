import React from 'react';
import { SvgXml } from 'react-native-svg';

const EditIcon = ({ width = 50, height = 50}) => {

  const svgXml = `
    <?xml version="1.0" encoding="utf-8"?>
    <!-- Your SVG XML content -->
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#6C63FF"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>
  `;

  return <SvgXml xml={svgXml} width={width} height={height} />;
};

export default EditIcon;


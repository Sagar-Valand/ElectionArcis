// // ToggleButton.js
// import React from 'react';
// import { useColorMode, Button } from '@chakra-ui/react';

// const ToggleButton = () => {
//   const { colorMode, toggleColorMode } = useColorMode();

//   return (
//     <Button onClick={toggleColorMode} mt={4}>
//       {colorMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
//     </Button>
//   );
// };

// export default ToggleButton;

// ToggleButton.js
import React from 'react';
import { useColorMode, Button, Icon } from '@chakra-ui/react';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';

const ToggleButton = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Button onClick={toggleColorMode} >
      {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
      {/* {colorMode === 'light' ? ' Switch to Dark Mode' : ' Switch to Light Mode'} */}
    </Button>
  );
};

export default ToggleButton;

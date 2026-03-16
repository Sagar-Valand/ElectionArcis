const mqtt = require('mqtt');
const appTopicSend = 'torque/app/tx/';
const appTopicReceive = 'torque/app/rx/';
const Stream = require('../models/streamModel');
const axios = require('axios');
const Camera = require('../models/cameraModel');
const fs = require('fs');

// get video quality
exports.getQuality = async (req, res) => {
  const { deviceId } = req.query;
  try {
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }
    const quality = await Stream.findOne({ deviceId: deviceId }).select('quality');

    if (!quality) {
      return res.status(404).json({ error: 'Quality not found' });
    }

    return res.status(200).json({ quality: quality });
  } catch (error) {
    console.error('Error Get encoding settings:', error.message);
    res.status(500).json({ error: 'Failed to Get encoding settings' });
  }
};

// update video quality
exports.setQuality = async (req, res) => {
  const { quality } = req.body;
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses
  try {
    // Get the request data (URL and body) based on the quality
    console.log(quality)
    if (!quality || !deviceId) {
      return res.status(400).json({ error: 'Missing quality or deviceid parameter' });
    }

    const closeStreamUrl = `http://media.arcisai.io:8080/api/closestream?streamPath=DVR/RTSP-${deviceId}`;
    await axios.get(closeStreamUrl)
      .then(response => {
        console.log('Stream closed :', response.data);
      })
      .catch(error => {
        console.error('Error closing stream:', error);
      })
      .finally(() => {
        const { mqttCase, body } = getRequestData(quality, deviceId);

        const options = {
          username: process.env.mqttUser,
          password: process.env.mqttPassword,
        };

        const client = mqtt.connect(process.env.mqtt_broker_url, options);

        client.on('message', (topic, message) => {
          if (!responseSent) {
            responseSent = true; // Set the flag to true
            const messageString = message.toString();
            console.log(`Message on topic ${topic}:`, messageString);

            try {
              // const parsedMessage = JSON.parse(messageString);
              // console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

              client.end(async () => {
                const qualityData = await Stream.findOneAndUpdate(
                  { deviceId: deviceId },
                  { quality: quality },
                  { new: true }
                );
                res.status(200).json(messageString);
              });
            } catch (err) {
              console.error('Error parsing JSON:', err);
              res.status(500).send('Invalid JSON format in the message body.');
              client.end();
            }

          }
        });

        client.on('connect', () => {
          console.log('Connected to the device');

          client.subscribe(`${appTopicReceive}${deviceId}/${mqttCase}`, (err) => {
            if (err) {
              console.error('Subscription error:', err);
            } else {
              console.log(`Subscribed to topics with prefix ${appTopicReceive}${deviceId}/${mqttCase}`);
              client.publish(`${appTopicSend}${deviceId}/${mqttCase}`, JSON.stringify(body));
            }
          });
        });

        client.on('error', (err) => {
          if (!responseSent) {
            responseSent = true;
            console.error('MQTT Client Error:', err);
            res.status(500).json({ message: 'Error with MQTT client' });
          }
        });
      })

  } catch (error) {
    console.error('Error updating encoding settings:', error.message);
    res.status(500).json({ error: 'Failed to update encoding settings' });
  }
};



// GET VIDEO SETTINGS
exports.getVideoSettings = async (req, res) => {
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses
  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout for the response
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Camera might be out of network');
        res.status(504).json({ message: 'Camera might be out of network' });
        client.end(); // Close the MQTT connection
      }
    }, 15000); // 15 seconds

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear the timeout

        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end();
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/6`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
        } else {
          console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
          client.publish(`${appTopicSend}${deviceId}/6`, 'GET VIDEO CHANNEL 1');
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear the timeout
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
      }
    });
  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error(error);
      res.status(500).json({ message: 'Error fetching video encode channel data' });
    }
  }
};

// SET VIDEO SETTINGS
exports.setVideoSettings = async (req, res) => {
  const { contrast, brightness, saturation, hue, sharpness, flip, mirror } = req.body;
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses
  const settings = {
    contrastLevel: Math.floor(contrast),
    brightnessLevel: Math.floor(brightness),
    saturationLevel: Math.floor(saturation),
    hueLevel: Math.floor(hue),
    sharpnessLevel: Math.floor(sharpness),
    flipEnabled: flip,
    mirrorEnabled: mirror,
  };

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout for the response
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Camera might be out of network');
        res.status(504).json({ message: 'Camera might be out of network' });
        client.end(); // Close the MQTT connection
      }
    }, 15000); // 15 seconds

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear the timeout
        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);

        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end();
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/20`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
        } else {
          console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
          client.publish(`${appTopicSend}${deviceId}/20`, JSON.stringify(settings));
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear the timeout
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
      }
    });
  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error updating settings:', error);
      res.status(error.response ? error.response.status : 500).json({
        message: error.message,
        error: error.response ? error.response.data : null,
      });
    }
  }
};

// GET AUDIO INFO
exports.getAudioInfo = async (req, res) => {
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout for the response
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Device might be out of network');
        res.status(504).json({ message: 'Device might be out of network' });
        client.end(); // Close the MQTT connection
      }
    }, 15000); // 15 seconds

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear the timeout
        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);

        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end();
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/42`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
        } else {
          console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
          client.publish(`${appTopicSend}${deviceId}/42`, 'get image');
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear the timeout
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
      }
    });
  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error fetching audio info:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error fetching audio info',
      });
    }
  }
};

// SET AUDIO INFO
exports.setAudioInfo = async (req, res) => {
  const deviceId = req.query.deviceId;
  const { enabled } = req.body;
  console.log(deviceId, enabled);
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout for the response
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Device might be out of network');
        res.status(504).json({ message: 'Device might be out of network' });
        client.end(); // Close the MQTT connection
      }
    }, 15000); // 15 seconds

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear the timeout
        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);

        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end();
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/43`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
        } else {
          console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
          client.publish(`${appTopicSend}${deviceId}/43`, JSON.stringify({ enabled }));
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear the timeout
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
      }
    });
  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error updating Set Audio Info:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error updating Set Audio Info',
      });
    }
  }
};

// GET IMAGE INFO
exports.getImageInfo = async (req, res) => {
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout for the response
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Device might be out of network');
        res.status(504).json({ message: 'Device might be out of network' });
        client.end(); // Close the MQTT connection
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear the timeout when a response is received

        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage.irCutFilter);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          client.end(() => {
            res.status(500).send('Invalid JSON format in the message body.');
          });
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/38`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/38`);
          client.publish(`${appTopicSend}${deviceId}/38`, 'GET IMAGE');
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear the timeout
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end();
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });
  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error fetching image info:', error);
      res.status(500).json({ message: 'Error fetching image info' });
    }
  }
};

// SET IMAGE INFO
exports.setImageInfo = async (req, res) => {
  const { irCutMode } = req.body;
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const setting = {
      irCutFilter: {
        irCutMode: irCutMode,
      },
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout for the response
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Device might be out of network');
        res.status(504).json({ message: 'Device might be out of network' });
        client.end(); // Close the MQTT connection
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout upon receiving a message

        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);

        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          client.end(() => {
            res.status(500).send('Invalid JSON format in the message body.');
          });
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/21`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Subscription error' });
            client.end();
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/21`);
          client.publish(`${appTopicSend}${deviceId}/21`, JSON.stringify(setting));
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end();
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });
  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error setting image info:', error);
      res.status(error.response ? error.response.status : 500).json({
        message: error.message,
        error: error.response ? error.response.data : null,
      });
    }
  }
};

// GET TIME SETTINGS
exports.getTimesettings = async (req, res) => {
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout for response handling
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Device might be out of network');
        res.status(504).json({ message: 'Device might be out of network' });
        client.end(); // Close the MQTT connection
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout when a response is received

        console.log(`Message on topic ${topic}:`, message.toString());
        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          client.end(() => {
            res.status(500).send('Invalid JSON format in the message body.');
          });
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/9`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Subscription error' });
            client.end();
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/9`);
          client.publish(`${appTopicSend}${deviceId}/9`, 'get Time Config');
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end();
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });
  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error getting time settings:', error);
      res.status(500).json({ message: 'Error fetching time settings' });
    }
  }
};

// SET NTP SETTINGS
exports.setTimesettings = async (req, res) => {
  const { ntpEnabled, ntpServerDomain } = req.body;
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    let ntpSettings = {
      ntpEnabled: ntpEnabled,
      ntpServerDomain: ntpServerDomain,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout for response handling
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Device might be out of network');
        res.status(504).json({ message: 'Device might be out of network' });
        client.end(); // Close the MQTT connection
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout when a response is received

        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);
        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          client.end(() => {
            res.status(500).send('Invalid JSON format in the message body.');
          });
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/23`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Subscription error' });
            client.end();
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/23`);
          client.publish(`${appTopicSend}${deviceId}/23`, JSON.stringify(ntpSettings));
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end();
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });
  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error setting NTP settings:', error);
      res.status(500).json({ message: 'Error setting NTP settings' });
    }
  }
};

// REBOOT CAMERA
exports.rebootCamera = async (req, res) => {
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout for response handling
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Device might be out of network');
        res.status(504).json({ message: 'Device might be out of network' });
        client.end(); // Close the MQTT connection
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout when a response is received

        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);

        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          client.end(() => {
            res.status(500).send('Invalid JSON format in the message body.');
          });
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/41`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Subscription error' });
            client.end();
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/41`);
          client.publish(`${appTopicSend}${deviceId}/41`, 'Reboot');
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end();
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });
  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error rebooting camera:', error);
      res.status(500).json({ message: 'Error rebooting camera' });
    }
  }
};

const getRequestData = (quality, deviceid) => {
  switch (quality) {
    case 'verylow':
      return {
        mqttCase: 40,
        body: {
          codecType: "H.264",
          h264Profile: "baseline",
          freeResolution: false,
          bitRateControlType: "VBR",
          resolution: "640x360",
          constantBitRate: 50,
          frameRate: 5,
          keyFrameInterval: 60,
        }
      };

    case 'low':
      return {
        mqttCase: 40,
        body: {
          codecType: "H.264",
          h264Profile: "baseline",
          freeResolution: false,
          bitRateControlType: "VBR",
          resolution: "640x360",
          constantBitRate: 100,
          frameRate: 5,
          keyFrameInterval: 60,
        }
      };

    case 'mid':
      return {
        mqttCase: 19,
        body: {
          codecType: "H.265",
          h264Profile: "high",
          freeResolution: false,
          channelName: "ARCIS AI",
          bitRateControlType: "VBR",
          resolution: "1280x720",
          constantBitRate: 200,
          frameRate: 12
        }
      };

    case 'high':
      return {
        mqttCase: 19,
        body: {
          codecType: "H.265",
          h264Profile: "high",
          freeResolution: false,
          channelName: "ARCIS AI",
          bitRateControlType: "VBR",
          resolution: "1920x1080",
          constantBitRate: 400,
          frameRate: 15
        }
      };
    case 'veryhigh':
      return {
        mqttCase: 19,
        body: {
          codecType: "H.265",
          h264Profile: "high",
          freeResolution: false,
          channelName: "ARCIS AI",
          bitRateControlType: "VBR",
          resolution: "2304x1296",
          constantBitRate: 800,
          frameRate: 20
        }
      };

    default:
      throw new Error('Invalid quality parameter');
  }
};


//////////////////////// edge ai controller   //////////////////////////////
// UPDATE MOTION ALARM SETTINGS
exports.updateMotionAlarmSettings = async (req, res) => {
  const { AlarmSound, AlarmWhiteLight } = req.body;
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const motionAlarmSetting = {
      AlarmSound: {
        Enabled: AlarmSound
      },
      AlarmWhiteLight: {
        Enabled: AlarmWhiteLight
      }
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout for response handling
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Device might be out of network');
        res.status(504).json({ message: 'Device might be out of network' });
        client.end(); // Close the MQTT connection
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout when a response is received

        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);

        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          client.end(() => {
            res.status(500).send('Invalid JSON format in the message body.');
          });
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/25`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Subscription error' });
            client.end();
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/25`);
          client.publish(`${appTopicSend}${deviceId}/25`, JSON.stringify(motionAlarmSetting));
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end();
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error updating alarm settings:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: "Error updating alarm settings"
      });
    }
  }
};


// GET MOTION DETECTION
exports.getMotionDetection = async (req, res) => {
  const deviceId = req.query.deviceId;
  console.log('Received request for device ID:', deviceId);
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout to prevent hanging the request for too long
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Device might be unresponsive');
        res.status(504).json({ message: 'Device might be unresponsive' });
        client.end(); // Close the MQTT connection after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout if a response is received

        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          client.end(() => {
            res.status(500).send('Invalid JSON format in the message body.');
          });
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/10`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Subscription error' });
            client.end(); // End the MQTT connection after error
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/10`);
          client.publish(`${appTopicSend}${deviceId}/10`, 'get Motion Detection');
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // End the MQTT connection after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error fetching motion detection data:', error);
      res.status(500).json({ message: 'Error fetching motion detection data' });
    }
  }
};

// SET MOTION DETECTION
exports.setMotionDetection = async (req, res) => {
  const { enabled, sensitivityLevel } = req.body;
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    let motionSetting = {
      enabled,
      detectionType: 'grid',
      detectionGrid: {
        sensitivityLevel
      }
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout to prevent the request from hanging for too long
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Device may be unresponsive');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Ensure the client disconnects after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout if a response is received

        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          client.end(() => {
            res.status(500).send('Invalid JSON format in the message body.');
          });
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/24`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Subscription error' });
            client.end(); // End the MQTT connection after error
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/24}`);
          client.publish(`${appTopicSend}${deviceId}/24`, JSON.stringify(motionSetting));
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // End the MQTT connection after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error updating motion detection settings:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error updating motion detection settings'
      });
    }
  }
};

// GET HUMAN OID
exports.getHumanoid = async (req, res) => {
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout to prevent the request from hanging for too long
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Device may be unresponsive');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Ensure the client disconnects after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout if a response is received

        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          client.end(() => {
            res.status(500).send('Invalid JSON format in the message body.');
          });
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/12`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Subscription error' });
            client.end(); // End the MQTT connection after error
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/12}`);
          client.publish(`${appTopicSend}${deviceId}/12`, 'get Human OID');
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // End the MQTT connection after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error fetching human OID data:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error fetching human OID data'
      });
    }
  }
};

// SET HUMANOID
exports.setHumanOid = async (req, res) => {
  const {
    Enabled,
    AudioAlert,
    LightAlert,
    Sensitivity,
    sensitivityStep
  } = req.body;

  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    // Construct data object for the request
    const data = {
      Enabled: Enabled,
      enabled: Enabled,
      drawRegion: true,
      sensitivityStep: sensitivityStep ? sensitivityStep : 'normal',
      spOSD: true,
      Sensitivity: Sensitivity ? Sensitivity : 50,
      AlarmOut: {
        AudioAlert: {
          Enabled: AudioAlert ? AudioAlert : false,
        },
        LightAlert: {
          Enabled: LightAlert ? LightAlert : false,
        },
        AppPush: {
          Enabled: true,
        },
      },
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout to prevent the request from hanging for too long
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Device may be unresponsive');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Ensure the client disconnects after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout if a response is received

        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);

        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          client.end(() => {
            res.status(500).send('Invalid JSON format in the message body.');
          });
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/27`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Subscription error' });
            client.end(); // End the MQTT connection after error
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/27}`);
          client.publish(`${appTopicSend}${deviceId}/27`, JSON.stringify(data));
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // End the MQTT connection after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error updating Human OID:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error updating Human OID settings',
      });
    }
  }
};

// GET FACE
exports.getFace = async (req, res) => {
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout to prevent the request from hanging for too long
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Device may be unresponsive');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Ensure the client disconnects after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout if a response is received

        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);

        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          client.end(() => {
            res.status(500).send('Invalid JSON format in the message body.');
          });
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/13`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Subscription error' });
            client.end(); // End the MQTT connection after error
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/13}`);
          client.publish(`${appTopicSend}${deviceId}/13`, 'get Face');
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // End the MQTT connection after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error getting face:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error getting face from device',
      });
    }
  }
};

// SET FACE
exports.setFace = async (req, res) => {
  const { Enabled, AudioAlert, LightAlert, Sensitivity } = req.body;
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    let data = {
      Enabled: Enabled,
      Sensitivity: Sensitivity,
      spOSD: true,
      AlarmOut: {
        AudioAlert: {
          Enabled: AudioAlert,
        },
        LightAlert: {
          Enabled: LightAlert,
        },
        AppPush: {
          Enabled: true,
        },
      },
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout to prevent request hanging for too long
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Device may be unresponsive');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Ensure the client disconnects after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout if response is received

        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);

        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          client.end(() => {
            res.status(500).send('Invalid JSON format in the message body.');
          });
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/28`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/28}`);
          client.publish(`${appTopicSend}${deviceId}/28`, JSON.stringify(data));
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client is disconnected after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error updating Set Face:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error updating Set Face',
      });
    }
  }
};

// GET LINE CROSS DETECTION
exports.getLineCross = async (req, res) => {
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Set a timeout to prevent the request from hanging indefinitely
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: Device may be unresponsive');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Ensure the client disconnects after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout when message is received

        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);

        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          client.end(() => {
            res.status(500).send('Invalid JSON format in the message body.');
          });
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/14`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/14}`);
          client.publish(`${appTopicSend}${deviceId}/14`, 'get Line Cross');
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error fetching line cross detection data:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error fetching line cross detection data',
      });
    }
  }
};


// SET LINE CROSS DETECTION
exports.setLineCross = async (req, res) => {
  const {
    Enabled,
    DetectLine,
    Direction,
    AudioAlert,
    LightAlert,
    Sensitivity
  } = req.body;
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    let data = {
      Enabled: Enabled,
      DetectLine: DetectLine,
      DetectObj: ["Human"],
      Direction: Direction,
      Sensitivity: Sensitivity,
      AlarmOut: {
        AudioAlert: {
          Enabled: AudioAlert,
        },
        LightAlert: {
          Enabled: LightAlert,
        },
        AppPush: {
          Enabled: true,
        },
      },
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Timeout to prevent the request from hanging forever
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: No response from the device');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Ensure client disconnects after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout once message is received

        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);
        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end(); // Ensure client disconnects after error
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/29`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/29}`);
          client.publish(`${appTopicSend}${deviceId}/29`, JSON.stringify(data));
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error updating Set Linecross:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error updating Set Linecross',
      });
    }
  }
};

// GET CUSTOMER STATS
exports.getCustomerStats = async (req, res) => {
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Timeout to prevent hanging if no response from the device
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: No response from the device');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Ensure client disconnects after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout once message is received

        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end(); // Ensure client disconnects after error
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/15`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/15}`);
          client.publish(`${appTopicSend}${deviceId}/15`, 'get Customer Stats');
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error fetching customer stats:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error fetching customer stats',
      });
    }
  }
};

// SET CUSTOMER STATS
exports.setCustomerStats = async (req, res) => {
  const { Enabled, DetectLine, Direction } = req.body;
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    let data = {
      Enabled: Enabled,
      DetectLine: DetectLine,
      DetectObj: ["Human"],
      Direction: Direction,
      spOSD: true,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Timeout to prevent hanging if no response from the device
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: No response from the device');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Ensure client disconnects after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout once message is received

        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);

        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end(); // Ensure client disconnects after error
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/30`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/30}`);
          client.publish(`${appTopicSend}${deviceId}/30`, JSON.stringify(data));
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error setting customer stats:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error setting customer stats',
      });
    }
  }
};

// GET AREA DETECTION
exports.getAreaDetection = async (req, res) => {
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Timeout to prevent hanging if no response from the device
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: No response from the device');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Ensure client disconnects after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout once message is received

        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end(); // Ensure client disconnects after error
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/16`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/16}`);
          client.publish(`${appTopicSend}${deviceId}/16`, 'get Area Detection');
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error getting area detection:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error getting area detection',
      });
    }
  }
};

// SET AREA DETECTION
exports.setAreaDetection = async (req, res) => {
  const {
    Enabled,
    Action,
    MinDuration,
    RepeatAlarmTime,
    Sensitivity,
    DetectRegion,
    Direction,
    AudioAlert,
    LightAlert
  } = req.body;

  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    let data = {
      Enabled,
      DetectRegion,
      DetectObj: ["Human"],
      Direction,
      Action,
      MinDuration,
      RepeatAlarmTime,
      Sensitivity,
      AlarmOut: {
        AudioAlert: { Enabled: AudioAlert },
        LightAlert: { Enabled: LightAlert },
        AppPush: { Enabled: true },
      },
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Timeout to prevent hanging if no response from the device
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: No response from the device');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Ensure client disconnects after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout once message is received

        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);

        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end(); // Ensure client disconnects after error
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/31`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/31}`);
          client.publish(`${appTopicSend}${deviceId}/31`, JSON.stringify(data));
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error setting area detection:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error setting area detection',
      });
    }
  }
};

// GET UNATTENDED OBJECT DETECTION
exports.getUnattendedObjectDetection = async (req, res) => {
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Timeout to prevent hanging if no response from the device
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: No response from the device');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Ensure client disconnects after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout once message is received

        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end(); // Ensure client disconnects after error
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/17`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/17}`);
          client.publish(`${appTopicSend}${deviceId}/17`, 'get Unattended Obj Detect');
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error fetching unattended object detection:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error fetching unattended object detection',
      });
    }
  }
};

// SET UNATTENDED OBJECT DETECTION
exports.setUnattendedObjectDetection = async (req, res) => {
  const {
    Enabled,
    MinDuration,
    Sensitivity,
    DetectRegion,
    AudioAlert,
    LightAlert
  } = req.body;
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    let data = {
      Enabled,
      DetectAera: DetectRegion,
      Duration: MinDuration,
      Sensitivity: Sensitivity,
      AlarmOut: {
        AudioAlert: {
          Enabled: AudioAlert,
        },
        LightAlert: {
          Enabled: LightAlert,
        },
        AppPush: {
          Enabled: true,
        },
      },
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Timeout to prevent hanging if no response from the device
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: No response from the device');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Ensure client disconnects after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout once message is received

        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);
        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end(); // Ensure client disconnects after error
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/32`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/32}`);
          client.publish(`${appTopicSend}${deviceId}/32`, JSON.stringify(data));
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error setting unattended object detection:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error setting unattended object detection',
      });
    }
  }
};

// GET MISSING OBJECT DETECTION
exports.getMissingObjectDetection = async (req, res) => {
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Timeout to prevent hanging if no response from the device
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: No response from the device');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Ensure client disconnects after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout once message is received

        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);
        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage);
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end(); // Ensure client disconnects after error
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/18`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/18}`);
          client.publish(`${appTopicSend}${deviceId}/18`, 'get Missing Obj Detect');
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error fetching missing object detection data:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error fetching missing object detection data',
      });
    }
  }
};

// SET MISSING OBJECT DETECTION
exports.setMissingObjectDetection = async (req, res) => {
  const {
    Enabled,
    MinDuration,
    Sensitivity,
    DetectRegion,
    AudioAlert,
    LightAlert
  } = req.body;
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    let data = {
      Enabled,
      DetectAera: DetectRegion,
      Duration: MinDuration,
      Sensitivity: Sensitivity,
      AlarmOut: {
        AudioAlert: {
          Enabled: AudioAlert,
        },
        LightAlert: {
          Enabled: LightAlert,
        },
        AppPush: {
          Enabled: true,
        },
      },
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Timeout to avoid waiting forever if the device does not respond
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: No response from the device');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Disconnect client after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout once message is received

        const messageString = message.toString();
        console.log(`Message on topic ${topic}:`, messageString);

        try {
          const parsedMessage = JSON.parse(messageString);
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage); // Send response
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end(); // Disconnect client on error
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/33`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect client if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/33}`);
          client.publish(`${appTopicSend}${deviceId}/33`, JSON.stringify(data));
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error updating Set Missing Object Detection:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error updating Set Missing Object Detection',
      });
    }
  }
};

// GET ALARM SETTING
exports.getAlertSettings = async (req, res) => {
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Timeout to prevent waiting forever if the device does not respond
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: No response from the device');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Disconnect client after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout once message is received

        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage); // Send response
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end(); // Disconnect client on error
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/46`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect client if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/46}`);
          client.publish(`${appTopicSend}${deviceId}/46`, 'get ALARM SETTING');
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error fetching alert settings:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error fetching alert settings',
      });
    }
  }
};

// SET ALARM SETTING
exports.setAlertSettings = async (req, res) => {
  const deviceId = req.query.deviceId;
  const bEnable = req.body.bEnable;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Timeout to prevent waiting forever if the device does not respond
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: No response from the device');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Disconnect client after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout once message is received

        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage); // Send response
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end(); // Disconnect client on error
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/47`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect client if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/47}`);
          client.publish(`${appTopicSend}${deviceId}/47`, JSON.stringify({
            bEnable: bEnable,
            nPort: 5050,
            szProtocol: "http",
            szServerIP: "alert.arcisai.io"
          }));
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error setting alert settings:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error setting alert settings',
      });
    }
  }
};

// PTZ SETTINGS

// exports.ptzSettings = async (req, res) => {
//   const { deviceId, step } = req.query;
//   let responseSent = false; // Flag to prevent multiple responses

//   try {
//     const options = {
//       username: process.env.mqttUser,
//       password: process.env.mqttPassword,
//     };

//     const client = mqtt.connect(process.env.mqtt_broker_url, options);

//     // Timeout to avoid waiting indefinitely
//     const timeout = setTimeout(() => {
//       if (!responseSent) {
//         responseSent = true;
//         console.error('Timeout: No response from the device');
//         res.status(504).json({ message: 'Device may be unresponsive' });
//         client.end(); // Disconnect client after timeout
//       }
//     }, 15000); // 15 seconds timeout

//     client.on('message', (topic, message) => {
//       if (!responseSent) {
//         responseSent = true; // Set the flag to true
//         clearTimeout(timeout); // Clear timeout once message is received

//         try {
//           const parsedMessage = JSON.parse(message.toString());
//           console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

//           client.end(() => {
//             res.status(200).json(parsedMessage); // Send the response
//           });
//         } catch (err) {
//           console.error('Error parsing JSON:', err);
//           res.status(500).send('Invalid JSON format in the message body.');
//           client.end(); // Disconnect client on error
//         }
//       }
//     });

//     client.on('connect', () => {
//       console.log('Connected to the device');

//       client.subscribe(`${appTopicReceive}${deviceId}/51`, (err) => {
//         if (err) {
//           console.error('Subscription error:', err);
//           if (!responseSent) {
//             responseSent = true;
//             res.status(500).json({ message: 'Error subscribing to topic' });
//             client.end(); // Disconnect client if subscription fails
//           }
//         } else {
//           console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/51}`);
//           client.publish(`${appTopicSend}${deviceId}/51`, step);
//         }
//       });
//     });

//     client.on('error', (err) => {
//       if (!responseSent) {
//         responseSent = true;
//         clearTimeout(timeout); // Clear timeout on error
//         console.error('MQTT Client Error:', err);
//         res.status(500).json({ message: 'Error with MQTT client' });
//         client.end(); // Ensure client disconnects after error
//       }
//     });

//     client.on('close', () => {
//       console.log('MQTT client connection closed');
//     });

//   } catch (error) {
//     if (!responseSent) {
//       responseSent = true;
//       console.error('Error setting PTZ settings:', error);
//       res.status(500).json({
//         statusCode: 1,
//         statusMessage: 'Error setting PTZ settings',
//       });
//     }
//   }
// };

// SET PTZ CONTROL (Topic 51) - Constant Speed Version


// SET PTZ CONTROL (Topic 51) - Fixed for Raw String
// exports.ptzSettings = async (req, res) => {
//   const { step, deviceId } = req.body;
//   console.log(`PTZ Request - Device ID: ${deviceId}, Step: ${step}`);

//   // 1. Validation
//   if (!deviceId) return res.status(400).json({ message: "Device ID is required" });
//   if (!step) return res.status(400).json({ message: "PTZ step is required" });

//   // ==================================================================
//   // TOPIC CONFIGURATION
//   // ==================================================================
//   const topicToSendTo = `torque/rx/${deviceId}/51`;
//   // PTZ is often "Fire and Forget", but we listen just in case
//   const topicToListenOn = `torque/tx/${deviceId}/51`;

//   let responseSent = false;
//   let client = null;
//   let timeoutTimer = null;

//   try {
//     const options = {
//       username: process.env.mqttuser,
//       password: process.env.mqttPassword,
//     };

//     console.log(`Connecting to MQTT for PTZ...`);
//     client = mqtt.connect(process.env.mqtt_broker_url, options);

//     // 2. TIMEOUT PROTECTION (Reduced to 5s for PTZ speed)
//     timeoutTimer = setTimeout(() => {
//       if (!responseSent) {
//         console.error(`Timeout: No confirmation for PTZ.`);
//         responseSent = true;
//         client.end();
//         // For PTZ, even if we timeout, the camera might have moved. 
//         // We return 200 to keep the UI responsive.
//         res.status(200).json({ message: 'step Sent (No Confirmation)' });
//       }
//     }, 5000);

//     client.on('connect', () => {
//       console.log('Connected to MQTT Broker');

//       // 3. SUBSCRIBE
//       client.subscribe(topicToListenOn, (err) => {
//         if (!err) {
//           console.log(`Listening on: ${topicToListenOn}`);

//           // ==================================================
//           // THE FIX: Send RAW STRING, not JSON
//           // ==================================================
//           // Previous (Wrong): {"step":"RIGHT", "speed":5}
//           // New (Correct): RIGHT\0

//           // Note: We append the speed to the string if your camera supports "RIGHT 5"
//           // If not, just send the step. Let's try just the step first.
//           const payloadString = step;

//           const payloadBuffer = Buffer.concat([
//             Buffer.from(payloadString, 'utf-8'),
//             Buffer.from([0]) // Null Byte for C-Code
//           ]);

//           console.log(`Sending Raw PTZ step: "${payloadString}"`);
//           client.publish(topicToSendTo, payloadBuffer, { qos: 1 });
//         }
//       });
//     });

//     client.on('message', (topic, message) => {
//       if (topic === topicToListenOn && !responseSent) {
//         responseSent = true;
//         clearTimeout(timeoutTimer);

//         const messageString = message.toString().replace(/\0/g, '');
//         console.log(`Received Reply:`, messageString);

//         // Even if it returns IMEI (Wrong info), we know the step reached the camera
//         client.end();
//         res.status(200).json({
//           success: true,
//           reply: messageString
//         });
//       }
//     });

//     client.on('error', (err) => {
//       console.error('MQTT Client Error:', err);
//       if (!responseSent) {
//         responseSent = true;
//         clearTimeout(timeoutTimer);
//         client.end();
//         res.status(500).json({ message: 'MQTT Connection Error' });
//       }
//     });

//   } catch (error) {
//     if (client) client.end();
//     console.error("Server Logic Error:", error);
//     if (!responseSent) res.status(500).json({ message: error.message });
//   }
// };

exports.ptzSettings = async (req, res) => {
  const { step, deviceId } = req.body;
  console.log(`PTZ Request - Device ID: ${deviceId}, Step: ${step}`);

  // 1. Validation
  if (!deviceId) return res.status(400).json({ message: "Device ID is required" });
  if (!step) return res.status(400).json({ message: "PTZ step is required" });

  // ================= TOPICS =================
  const topicToSendTo = `torque/rx/${deviceId}/51`;
  const topicToListenOn = `torque/tx/${deviceId}/51`;

  let responseSent = false;
  let client = null;
  let timeoutTimer = null;

  try {
    // ================= STATIC MQTT CONFIG (TEST) =================
    const options = {
      username: "Torque",
      password: "Raptor@0",
      reconnectPeriod: 0
    };

    const brokerUrl = "http://provisioning.vmukti.com:1883";

    console.log("Connecting to MQTT for PTZ...");
    client = mqtt.connect(brokerUrl, options);

    // ================= TIMEOUT =================
    timeoutTimer = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        client.end();
        return res.status(200).json({
          success: true,
          message: "step Sent (No Confirmation)"
        });
      }
    }, 5000);

    client.on("connect", () => {
      console.log("Connected to MQTT Broker");

      client.subscribe(topicToListenOn, () => {
        console.log(`Listening on: ${topicToListenOn}`);

        const payloadString = step.toUpperCase();

        const payloadBuffer = Buffer.concat([
          Buffer.from(payloadString, "utf-8"),
          Buffer.from([0]) // NULL byte
        ]);

        console.log(`Sending Raw PTZ step: "${payloadString}"`);
        client.publish(topicToSendTo, payloadBuffer, { qos: 1 });

        // ================= AUTO STOP =================
        if (payloadString !== "STOP") {
          setTimeout(() => {
            const stopBuffer = Buffer.concat([
              Buffer.from("STOP", "utf-8"),
              Buffer.from([0])
            ]);
            console.log("Auto STOP sent");
            client.publish(topicToSendTo, stopBuffer, { qos: 1 });
          }, 800);
        }
      });
    });

    client.on("message", (topic, message) => {
      if (topic === topicToListenOn && !responseSent) {
        responseSent = true;
        clearTimeout(timeoutTimer);

        const reply = message.toString().replace(/\0/g, "");
        console.log("Received Reply:", reply);

        client.end();
        return res.status(200).json({
          success: true,
          reply
        });
      }
    });

    client.on("error", (err) => {
      console.error("MQTT Client Error:", err);
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeoutTimer);
        client.end();
        return res.status(500).json({ message: "MQTT Connection Error" });
      }
    });

  } catch (error) {
    if (client) client.end();
    console.error("Server Logic Error:", error);
    if (!responseSent) {
      return res.status(500).json({ message: error.message });
    }
  }
};

// Get Edge Event
exports.edgeEvents = async (req, res) => {
  const { deviceId } = req.query;
  const {
    TypeFlags2 = "0x7E033",
    Date,
    BeginTime = "00:00:00",
    EndTime = "23:59:59",
    PageSize = 10,
    CurrentPage = 1
  } = req.body;

  let responseSent = false; // Flag to prevent multiple responses

  try {
    // MQTT options
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    // Prepare the data to be sent in the request
    const data = {
      DEV: "IPC",
      VER: "1.0",
      API: "R.SearchRecord",
      Parameter: {
        Type: ["True", "True"],
        Date: Date,
        BeginTime: BeginTime,
        EndTime: EndTime,
        PageSize: Math.floor(PageSize),
        CurrentPage: Math.floor(CurrentPage),
        Reload: "True",
        TypeFlags2: TypeFlags2,
      }
    };

    // Fetch camera name from the database
    const cameraName = await Camera.findOne({ deviceId: deviceId }).select('name');
    if (!cameraName) {
      return res.status(404).json({ message: 'Camera not found' });
    }

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Timeout to avoid waiting indefinitely
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: No response from the device');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Disconnect client after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout once message is received

        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          const formattedMessage = {
            ...parsedMessage,
            cameraName: cameraName.name,
          };

          client.end(() => {
            res.status(200).json(formattedMessage); // Send the response
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end(); // Disconnect client on error
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/48`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect client if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/48}`);
          client.publish(`${appTopicSend}${deviceId}/48`, JSON.stringify(data));
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error fetching edge events:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error fetching edge events',
      });
    }
  }
};

exports.tfdata = async (req, res) => {
  const { currentPage, formattedDate, deviceId, TypeFlags2, pagesize, p2porigin } = req.body;
  // const deviceId = req.query.deviceId;
  console.log(p2porigin)

  const requestBody = {
    deviceId: deviceId,
    DEV: 'IPC',
    VER: '1.0',
    API: 'R.SearchRecord',
    Parameter: {
      Type: ["True", "True"],
      Date: formattedDate,
      BeginTime: '00:00:00',
      EndTime: '23:59:59',
      PageSize: pagesize,
      CurrentPage: currentPage,
      Reload: 'True',
      TypeFlags2: TypeFlags2
    }
  };

  try {
    const response = await axios.put(`https://${deviceId}.${p2porigin}/netsdk/R.SearchRecord`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic YWRtaW46', // Ensure this is correct and properly encoded
      }
    });
    // console.log(response.data)
    res.json(response.data);
  } catch (error) {
    // console.error('Error making PUT request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// GET ALARM SETTING
exports.getHumanTracking = async (req, res) => {
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Timeout to prevent waiting forever if the device does not respond
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: No response from the device');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Disconnect client after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout once message is received

        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage); // Send response
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end(); // Disconnect client on error
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/52`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect client if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/46}`);
          client.publish(`${appTopicSend}${deviceId}/52`, 'get Human Tracking');
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error fetching alert settings:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error fetching alert settings',
      });
    }
  }
};

// SET ALARM SETTING
exports.setHumanTracking = async (req, res) => {
  const deviceId = req.query.deviceId;
  const { motionTracking, cruiseMode } = req.body;
  console.log("Data", motionTracking, cruiseMode)
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Timeout to prevent waiting forever if the device does not respond
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: No response from the device');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Disconnect client after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout once message is received

        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage); // Send response
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end(); // Disconnect client on error
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/53`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect client if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/53}`);
          client.publish(`${appTopicSend}${deviceId}/53`, JSON.stringify({
            motionTracking,
            cruiseMode
          }));
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error setting alert settings:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error setting alert settings',
      });
    }
  }
};

// GET ALARM SETTING
exports.getAlarmSettings = async (req, res) => {
  const deviceId = req.query.deviceId;
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    // Timeout to prevent waiting forever if the device does not respond
    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        console.error('Timeout: No response from the device');
        res.status(504).json({ message: 'Device may be unresponsive' });
        client.end(); // Disconnect client after timeout
      }
    }, 15000); // 15 seconds timeout

    client.on('message', (topic, message) => {
      if (!responseSent) {
        responseSent = true; // Set the flag to true
        clearTimeout(timeout); // Clear timeout once message is received

        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

          client.end(() => {
            res.status(200).json(parsedMessage); // Send response
          });
        } catch (err) {
          console.error('Error parsing JSON:', err);
          res.status(500).send('Invalid JSON format in the message body.');
          client.end(); // Disconnect client on error
        }
      }
    });

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/54`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect client if subscription fails
          }
        } else {
          console.log(`Subscribed to topic ${appTopicReceive}${deviceId}/54}`);
          client.publish(`${appTopicSend}${deviceId}/54`, 'get Alarm Settings');
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        clearTimeout(timeout); // Clear timeout on error
        console.error('MQTT Client Error:', err);
        res.status(500).json({ message: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error fetching alert settings:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error fetching alert settings',
      });
    }
  }
};



exports.talkToCamera = async (req, res) => {
  const { deviceId } = req.body;
  console.log('Received request to talk to camera with deviceId:', deviceId);

  const inputFile = req.file?.path; // Path of the uploaded MP3 file
  let responseSent = false; // Flag to prevent multiple responses

  try {
    const options = {
      username: process.env.mqttUser,
      password: process.env.mqttPassword,
    };

    const client = mqtt.connect(process.env.mqtt_broker_url, options);

    client.on('connect', () => {
      console.log('Connected to the device');

      client.subscribe(`${appTopicReceive}${deviceId}/56`, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: 'Error subscribing to topic' });
            client.end(); // Disconnect client if subscription fails
          }
        } else {
          console.log('Subscribed to topic successfully');
          const audioData = fs.readFileSync(inputFile);
          const chunkSize = 1024; // Chunk size in bytes
          let offset = 0;

          // Stream MP3 data in chunks
          const interval = setInterval(() => {
            if (offset >= audioData.length) {
              clearInterval(interval);
              console.log('Audio streaming completed');

              // Send "Streamend" message
              client.publish(`${appTopicSend}${deviceId}/56`, 'Streamend', { qos: 1 });
              client.end();
              console.log('Published "Streamend" to MQTT');

              // Cleanup: Delete uploaded MP3 file
              try {
                if (fs.existsSync(inputFile)) {
                  fs.unlinkSync(inputFile);
                  console.log(`Deleted uploaded file: ${inputFile}`);
                } else {
                  console.warn(`File not found for deletion: ${inputFile}`);
                }
              } catch (err) {
                console.error('Error deleting uploaded file:', err);
              }
              return;
            }

            const chunk = audioData.slice(offset, offset + chunkSize);
            client.publish(`${appTopicSend}${deviceId}/56`, chunk, { qos: 1 });
            console.log('Published MP3 chunk to MQTT');
            offset += chunkSize;
          }, 20); // Send a chunk every 20ms.

          return res.status(200).json({ success: true, data: 'Audio streaming started' });
        }
      });
    });

    client.on('error', (err) => {
      if (!responseSent) {
        responseSent = true;
        console.error('MQTT Client Error:', err);
        res.status(500).json({ data: 'Error with MQTT client' });
        client.end(); // Ensure client disconnects after error

        // Cleanup: Delete uploaded MP3 file
        try {
          if (fs.existsSync(inputFile)) {
            fs.unlinkSync(inputFile);
            console.log(`Deleted uploaded file: ${inputFile}`);
          } else {
            console.warn(`File not found for deletion: ${inputFile}`);
          }
        } catch (err) {
          console.error('Error deleting uploaded file:', err);
        }
      }
    });

    client.on('close', () => {
      console.log('MQTT client connection closed');
    });
  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.error('Error handling request:', error);
      res.status(500).json({
        statusCode: 1,
        statusMessage: 'Error processing the request',
      });

      // Cleanup: Delete uploaded MP3 file
      try {
        if (fs.existsSync(inputFile)) {
          fs.unlinkSync(inputFile);
          console.log(`Deleted uploaded file: ${inputFile}`);
        } else {
          console.warn(`File not found for deletion: ${inputFile}`);
        }
      } catch (err) {
        console.error('Error deleting uploaded file:', err);
      }
    }
  }
};

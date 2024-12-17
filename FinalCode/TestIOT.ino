/* Heltec Automation LoRaWAN communication example
 *
 * Function:
 * 1. Upload node data to the server using the standard LoRaWAN protocol.
 *  
 * Description:
 * 1. Communicate using LoRaWAN protocol.
 * 
 * HelTec AutoMation, Chengdu, China
 * 成都惠利特自动化科技有限公司
 * www.heltec.org
 *
 * */

#include "LoRaWan_APP.h"
#include "Wire.h"
#include "GXHTC.h"
#include <TinyGPS++.h>

GXHTC gxhtc;


//CAPTEURS
int receiverPin = 47;
int laserPin = 48;
unsigned long timer = 0; 
bool stateHigh = false;
bool isFull = false;
bool notFull = false; 
String answer =" ";
float latitude;
float longitude; 
//uint32_t hexLongitude;
//uint32_t hexLatitude;


//GPS
static const int RXPin = 18; // RX du GPS -> TX du GPS
static const int TXPin = 17; // TX du GPS -> RX du GPS
static const uint32_t GPSBaud = 9600; 

TinyGPSPlus gps;


unsigned long lastGPSUpdate = 0; 
const unsigned long gpsUpdateInterval = 5000; // GPS mise à jour toutes les 5 secondes

/* OTAA para*/
uint8_t devEui[] = { 0x70, 0xB3, 0xD5, 0x7E, 0xD0, 0x06, 0xB3, 0xDA };
uint8_t appEui[] = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
uint8_t appKey[] = { 0xC1, 0xF2, 0xB0, 0x30, 0x25, 0xA1, 0x12, 0xDC, 0x9A, 0x96, 0x90, 0x54, 0x2B, 0x7D, 0xC7, 0xCF };

/* ABP para*/
uint8_t nwkSKey[] = { 0x15, 0xb1, 0xd0, 0xef, 0xa4, 0x63, 0xdf, 0xbe, 0x3d, 0x11, 0x18, 0x1e, 0x1e, 0xc7, 0xda,0x85 };
uint8_t appSKey[] = { 0xd7, 0x2c, 0x78, 0x75, 0x8c, 0xdc, 0xca, 0xbf, 0x55, 0xee, 0x4a, 0x77, 0x8d, 0x16, 0xef,0x67 };
uint32_t devAddr =  ( uint32_t )0x007e6ae1;

/*LoraWan channelsmask, default channels 0-7*/ 
uint16_t userChannelsMask[6]={ 0x00FF,0x0000,0x0000,0x0000,0x0000,0x0000 };

/*LoraWan region, select in arduino IDE tools*/
LoRaMacRegion_t loraWanRegion = ACTIVE_REGION;

/*LoraWan Class, Class A and Class C are supported*/
DeviceClass_t  loraWanClass = CLASS_A;

/*the application data transmission duty cycle.  value in [ms].*/
uint32_t appTxDutyCycle = 15000;

/*OTAA or ABP*/
bool overTheAirActivation = true;

/*ADR enable*/
bool loraWanAdr = true;

/* Indicates if the node is sending confirmed or unconfirmed messages */
bool isTxConfirmed = true;

/* Application port */
uint8_t appPort = 2;
/*!
* Number of trials to transmit the frame, if the LoRaMAC layer did not
* receive an acknowledgment. The MAC performs a datarate adaptation,
* according to the LoRaWAN Specification V1.0.2, chapter 18.4, according
* to the following table:
*
* Transmission nb | Data Rate
* ----------------|-----------
* 1 (first)       | DR
* 2               | DR
* 3               | max(DR-1,0)
* 4               | max(DR-1,0)
* 5               | max(DR-2,0)
* 6               | max(DR-2,0)
* 7               | max(DR-3,0)
* 8               | max(DR-3,0)
*
* Note, that if NbTrials is set to 1 or 2, the MAC will not decrease
* the datarate, in case the LoRaMAC layer did not receive an acknowledgment
*/
uint8_t confirmedNbTrials = 4;

/* Prepares the payload of the frame */
static void prepareTxFrame( uint8_t port )
{
  /*appData size is LORAWAN_APP_DATA_MAX_SIZE which is defined in "commissioning.h".
  *appDataSize max value is LORAWAN_APP_DATA_MAX_SIZE.
  *if enabled AT, don't modify LORAWAN_APP_DATA_MAX_SIZE, it may cause system hanging or failure.
  *if disabled AT, LORAWAN_APP_DATA_MAX_SIZE can be modified, the max value is reference to lorawan region and SF.
  *for example, if use REGION_CN470, 
  *the max value for different DR can be found in MaxPayloadOfDatarateCN470 refer to DataratesCN470 and BandwidthsCN470 in "RegionCN470.h".
  */
  // ghxtc3();

  // ghxtc3();
  //delay(100);
  
  appDataSize = 0;
  if(stateHigh){
      latitude = 50.850025;
      longitude = 4.454150;

      uint32_t encodedLatitude = (uint32_t)(latitude * 10000000);
      uint32_t encodedLongitude = (uint32_t)(longitude * 10000000);

      uint8_t lat1 = (encodedLatitude >> 24) & 0xFF;
      uint8_t lat2 = (encodedLatitude >> 16) & 0xFF;
      uint8_t lat3 = (encodedLatitude >> 8) & 0xFF;
      uint8_t lat4 = encodedLatitude & 0xFF;

      uint8_t long1 = (encodedLongitude >> 24) & 0xFF;
      uint8_t long2 = (encodedLongitude >> 16) & 0xFF;
      uint8_t long3 = (encodedLongitude >> 8) & 0xFF;
      uint8_t long4 = encodedLongitude & 0xFF;
      
      appData[appDataSize++] =0x01;
      appData[appDataSize++] = lat1;
      appData[appDataSize++] = lat2;
      appData[appDataSize++] = lat3;
      appData[appDataSize++] = lat4;

      appData[appDataSize++] = long1;
      appData[appDataSize++] = long2;
      appData[appDataSize++] = long3;
      appData[appDataSize++] = long4;
  }else if(stateHigh == false){

      latitude = 50.850025;
      longitude = 4.454150;

      uint32_t encodedLatitude = (uint32_t)(latitude * 10000000);
      uint32_t encodedLongitude = (uint32_t)(longitude * 10000000);

      uint8_t lat1 = (encodedLatitude >> 24) & 0xFF;
      uint8_t lat2 = (encodedLatitude >> 16) & 0xFF;
      uint8_t lat3 = (encodedLatitude >> 8) & 0xFF;
      uint8_t lat4 = encodedLatitude & 0xFF;

      uint8_t long1 = (encodedLongitude >> 24) & 0xFF;
      uint8_t long2 = (encodedLongitude >> 16) & 0xFF;
      uint8_t long3 = (encodedLongitude >> 8) & 0xFF;
      uint8_t long4 = encodedLongitude & 0xFF;
      appData[appDataSize++] =0x00;
      appData[appDataSize++] = lat1;
      appData[appDataSize++] = lat2;
      appData[appDataSize++] = lat3;
      appData[appDataSize++] = lat4;

      appData[appDataSize++] = long1;
      appData[appDataSize++] = long2;
      appData[appDataSize++] = long3;
      appData[appDataSize++] = long4;
  }

    Serial.println("Payload prêt :");
    for (uint8_t i = 0; i < appDataSize; i++) {
        Serial.print("Byte ");
        Serial.print(i);
        Serial.print(": 0x");
        if (appData[i] < 0x10) Serial.print("0");
        Serial.println(appData[i], HEX);
    }

    Serial.println("End of the payload.\n");
    
    delay(100);
    Wire.end();
  
}

//if true, next uplink will add MOTE_MAC_DEVICE_TIME_REQ 


void setup() {
  pinMode(receiverPin, INPUT);
  pinMode(laserPin, OUTPUT);
  digitalWrite(laserPin, HIGH);
  Mcu.begin(HELTEC_BOARD,SLOW_CLK_TPYE);

  Serial.begin(115200);          
  Serial1.begin(GPSBaud, SERIAL_8N1, RXPin, TXPin); 
  Serial.println("Starting of the system :Infra-red laser and GPS...");
}

void loop()
{

  int State = digitalRead(receiverPin); 

  if (State == LOW && notFull == false) {
    Serial.println("Poubelle vide ou pas encore remplie");
    timer = 0; 
    stateHigh = false;
    notFull = true; 
  } 

  if (State == HIGH && stateHigh == false) {
    Serial.println("Début du comptage");
    timer = millis(); 
    stateHigh = true;
    notFull = false; 
  }

  if (State == HIGH && stateHigh == true) {
    if (millis() - timer >= 10000) {
      Serial.print("Poubelle remplie à l'addresse : ");
    }
  }

  while (Serial1.available() > 0) {
    char c = Serial1.read();
    gps.encode(c);
  }

  


  switch( deviceState )
  {
    case DEVICE_STATE_INIT:
    {
#if(LORAWAN_DEVEUI_AUTO)
      LoRaWAN.generateDeveuiByChipID();
#endif
      LoRaWAN.init(loraWanClass,loraWanRegion);
      //both set join DR and DR when ADR off 
      LoRaWAN.setDefaultDR(3);
      break;
    }
    case DEVICE_STATE_JOIN:
    {
      LoRaWAN.join();
      break;
    }
    case DEVICE_STATE_SEND:
    {
      prepareTxFrame( appPort );
      LoRaWAN.send();
      Serial.println("Send");
      deviceState = DEVICE_STATE_CYCLE;
      break;
    }
    case DEVICE_STATE_CYCLE:
    {
      // Schedule next packet transmission
      txDutyCycleTime = appTxDutyCycle + randr( -APP_TX_DUTYCYCLE_RND, APP_TX_DUTYCYCLE_RND );
      LoRaWAN.cycle(txDutyCycleTime);
      deviceState = DEVICE_STATE_SLEEP;
      break;
    }
    case DEVICE_STATE_SLEEP:
    {
      LoRaWAN.sleep(loraWanClass);
      break;
    }
    default:
    {
      deviceState = DEVICE_STATE_INIT;
      break;
    }
  }
}

void printGPSLocation() {
  latitude = 50.850025;
  longitude = 4.454150;
  if (gps.location.isUpdated()) {
    //latitude = gps.location.lat();
    //longitude = gps.location.lng();
    longitude = 4.454150;
    //50.850025,4.454150
    Serial.print(latitude, 6);
    Serial.print(",");
    Serial.println(longitude, 6);
  } else {
    Serial.println("No GPS data available...");
  }
}

#!/bin/bash
ifconfig wlan0 down
pppd call gprs
route add -net 0.0.0.0 ppp0


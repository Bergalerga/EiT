
# -*- coding: utf-8 -*-  
import pygame
import os
import math
import urllib
from PIL import Image
from cStringIO import StringIO
pygame.init()



longitude = []
latitude=[]
elevation=[]
rotation=[]
image_rot = 60
inp = open ("img/navdata.txt","r")
for line in inp.readlines():
	if line.startswith("longitude"):
		number = line[12:]
		longitude.append(float(number))
	if line.startswith("latitude"):
		number = line[11:]
		latitude.append(float(number))
	if line.startswith("elevation"):
		number = line[12:]
		elevation.append(float(number))
	if line.startswith("mz"):
		number = line[5:]
		rotation.append(float(number))

xCoordList = []
yCoordList = []
for i in range(len(longitude)):
	xCoordList.append((longitude[i]-longitude[0])*49770000) # Distanse i millimeter, origo flyttet til midten
	yCoordList.append((latitude[i]-latitude[0])*111200000) # Distanse i millimeter, origo flyttet til midten

image_list=os.listdir("/home/even/Documents/Lek/EiT/img") #Hent liste over bilder
for temp in image_list[:]: #Sjekk at alt som ble hentet er bilder, forkast resten
    if not(temp.endswith(".png")):
        image_list.remove(temp)

print xCoordList
print yCoordList
print elevation
print rotation
zoom = 17

meters_per_pixel = 156543.03392 * math.cos(latitude[0] * 3.14159265359 / 180) / math.pow(2, zoom)
print meters_per_pixel
url = "http://maps.googleapis.com/maps/api/staticmap?center="+str(latitude[0])+","+str(longitude[0])+"&size=640x640&zoom="+str(zoom)+"&sensor=false&maptype=hybrid"
print(url)
buffer = StringIO(urllib.urlopen(url).read())
google_map =Image.open(buffer)
google_map.save('test.png')


map_height = 5000
map_width = 5000 
sorted_images = sorted(image_list, key=lambda x: int((x.split('.')[0]).replace("frame",""))) #Sorter etter bildenummer
screen = pygame.display.set_mode((map_width, map_height)) #init bakgrunn
screen.fill((255, 255, 255)) #Hvit bakgrunn
i = 0
for img in sorted_images:
	if (elevation[i]!=0):
	    image = pygame.image.load("img/"+img) #Load og prosesser hvert enkelt bilde
	    image2 = pygame.transform.laplacian(image)
	    pygame.image.save(image2, img)
	    width = int(image.get_width()*elevation[i]*1.4265) #1Pixel = 1mm
	    height =int(image.get_height()*elevation[i]*1.4265) #1Pixel = 1 mm
	    image = pygame.transform.scale(image, (width, height))
	    image.set_colorkey(0,0)									#Fjerne omriss ved rotasjon
	    image = pygame.transform.rotate(image,-rotation[i]) #Rotasjon mot klokka.
	    screen.blit(image, (map_width/2 + (xCoordList[i]-image.get_width()/2),map_height/2 + (yCoordList[i]-image.get_height()/2)))
	    print "Added: ", img
	    i+=1
	else:
		
		print "Did not use: ", img, ", too low altitude (", elevation[i], " m)."
		i+=1
screen.set_colorkey((255,255,255), 0)
width_in_metres = map_width/1000
height_in_metres = map_height/1000
google_map = pygame.image.load("test.png")
generated_map = screen
width_map_in_metres = google_map.get_width()*meters_per_pixel
height_map_in_metres = google_map.get_height()*meters_per_pixel

google_map = pygame.transform.scale(google_map, (10000, 10000))

print height_map_in_metres, width_map_in_metres
print height_in_metres, width_in_metres

new_height_in_metres=int(10000*(height_in_metres/height_map_in_metres))
new_width_in_metres = int(10000*(width_in_metres/width_map_in_metres))
print new_height_in_metres
generated_map = pygame.transform.scale(generated_map, (new_height_in_metres, new_width_in_metres))
pygame.image.save(generated_map, "temp_gen.png")
google_map.blit(generated_map, ((10000-new_height_in_metres)/2, (10000-new_width_in_metres)/2))
pygame.image.save(screen, "temp_map.png") #Save resultat
screen = pygame.transform.laplacian(screen)
pygame.image.save(screen, "alt_temp_map.png")
pygame.image.save(google_map, "merged_map.png")


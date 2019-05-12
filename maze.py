# take in a PNG image of a maze (from dadaelus + some modification), and convert into a bitmap
import numpy as np
from bitarray import bitarray
from PIL import Image
np.set_printoptions(threshold=np.inf)
im = Image.open("maze.png")

data = np.asarray(im)

width = len(data)
height = len(data[0])

bitmap = np.ones((width//2,height//2), dtype=int)


for i in range(0, width, 2): 
  for j in range(0, height, 2):
    x = i // 2
    y = j // 2
    if (list(data[i,j]) == list([255,255,255])):
      bitmap[x,y] = 0


bitstring = ""
for x in bitmap.flatten():
  if x == 1:
    bitstring += '1'
  else:
    bitstring += '0'

bits = bitarray(bitstring)

with open('maze.bin', 'wb') as fh:
  bits.tofile(fh)
 

print("width: %d, height: %d" %(width//2, height//2))






export function validateHotelImage(uri:string){
 const b=Buffer.from(uri.split(',')[1]||'','base64');let width=0,height=0;
 if(b.length>262500)throw Error('Hotel photo exceeds 256 KB.');
 if(b.length>=24&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&b.toString('ascii',12,16)==='IHDR'){width=b.readUInt32BE(16);height=b.readUInt32BE(20);}
 else if(b[0]===255&&b[1]===216){let offset=2;while(offset+4<b.length){if(b[offset]!==255)break;const marker=b[offset+1];if(marker===0xda||marker===0xd9)break;const size=b.readUInt16BE(offset+2);if(size<2||offset+2+size>b.length)break;if([0xc0,0xc1,0xc2].includes(marker)&&size>=7){height=b.readUInt16BE(offset+5);width=b.readUInt16BE(offset+7);break;}offset+=size+2;}}
 if(!width||!height||width>2400||height>2400)throw Error('Use a valid JPEG/PNG hotel photo no larger than 2400 pixels.');
 return b;
}

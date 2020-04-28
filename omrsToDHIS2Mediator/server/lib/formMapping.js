'use strict'
const URI = require('urijs')
const _ = require('underscore');
const utils = require('./utils')
const apiConf = process.env.NODE_ENV === 'test' ? require('../config/test') : require('../config/config')

const winston = require('winston');
var request = require('request');

//{uuid:dhis2}
exports.form1MappingTable = [
  { "774f49dc-cd95-4f7e-a20f-b38f9a1f52c4": "FsbargPR5hR" },
  { "e4e62a59-91cf-4323-a140-aeaceae6c520": "SNcELOKJCTs" },
  { "9fa91969-35bc-48aa-8ffd-fea157299d4d": "K4l00GKVInN" },
  { "b4b0e241-e41a-4d46-89dd-e531cf6d8202": "W58gazENRqS" },
  { "819f5ebe-0b3e-44ba-b435-8f3d1b7bb130": "MCaRcKcQByZ" },
  { "9340dede-5124-49cf-9b3c-5153cc0e537f": "Uz46DvWmRpz" },
  { "092e2163-e657-4961-b554-96ce2c21d051": "buRJTweOy6h" },
  { "fe5fdddf-96ee-42af-9b36-0ab8c3ddd05d": "KX4MrpcRuAb" },
  { "3cee2924-26fe-102b-80cb-0017a47871b2": "xHo7COhyMKM" },
  { "504e851d-8a95-4f0f-bcad-ca081a975abf": "GyqLOJRotuL" },
  { "41c410a4-18a4-4221-98ad-1daf1b22de4d": "CIh22FjXvOR" },
  { "2ecf52c4-f732-46a8-9f10-45a04ca70f49": "MgkDDuHQHeN" },
  { "d1ecd154-13b1-433a-8480-3213e178aff7": "m3pQUNk6AeL" },
  { "3ce84c8e-26fe-102b-80cb-0017a47871b2": "dP9kDCGW6C1" },
  { "3ce84b1c-26fe-102b-80cb-0017a47871b2": "SdIpSKZhA6a" },
  { "d4a45c62-5d82-43a2-856d-6c75db9fe842": "Zxkghqkbn7p" },
  { "78240034-73f3-46d8-b688-81fb99f27056": "mzWU3p77ybU" },
  { "a71fff61-4db8-43ce-98f8-5de7f689f560": "ABFDAJwKeRZ" },
  { "e42027db-5008-4cb0-8131-af2d84f59734": "C58YCNuA64x" },
  { "ca27eadb-c14d-414e-8db9-694b3831e719": "zDFb1kASBZ8" },
  { "a8415b6a-065d-4cd6-9c70-4cdcec7bf8ef": "gTyCR0HFnjp" },
  { "f95bdebd-c174-4eaa-86cf-067f78db5364": "c6lPSpoY2T5" },
  { "825ee96c-5277-4b29-bece-7d94e654da34": "LUcOAQklmNQ" },
  { "7f0dd8e6-f0c3-4cb1-a81e-24391fc7200b": "S9NJxxEdqyk" },
  { "98463468-4bc0-4df0-8b78-ad5e208c5d2a": "BRDfNrkhRRW" },
  { "1394d37f-38ca-4f8a-a486-ac46e0ed7523": "XJERkeIHfcE" },
  { "d0385b0e-c9ac-4f63-ab8d-b6273c029f9d": "iKzBZiMwvGw" },
  { "438e1ee2-5642-4868-867d-960eca6e6451": "scledbnTVVK" },
  { "3cd3a7a2-26fe-102b-80cb-0017a47871b2": "ITvtdUBslbU" },
  { "3cd28732-26fe-102b-80cb-0017a47871b2": "Pey8Tb56rwN" },
  { "3cd6fac4-26fe-102b-80cb-0017a47871b2": "kNRJ08nuqpC" },
  { "5d90078d-43d5-4ea1-9bf6-cda5398d1d67": "mfAyPSJA74t" },
  { "3cd6f600-26fe-102b-80cb-0017a47871b2": "C2BW6i7KIr9" },
  { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "R4fVlOAVmEw" },
  { "d300cfbb-c771-44db-8272-7065efc88242": "iz0c8aW79QH" },
  { "c1ef1230-a9f7-4593-bdc8-1e9a08d45968": "AbJydX5nX3k" },
  { "5e053da8-f8ac-4f4d-902f-dba756a312a5": "IV8M4e6l5oI" },
  { "e7fbe2c7-b9c4-4caa-83f3-3fc327a225c4": "Fl4NhPnptVk" },
  { "35de662a-63de-4dbc-92c4-2b08165406ab": "loFQ4dZf0eq" },
  { "d195e749-fa4a-43e3-8ceb-a72f25fb2be4": "MCTcHYKya23" },
  { "6c93ead4-d189-4476-a81d-1bef16bda6a4": "PVLjZ2ZWQVS" },
  { "8919a43c-fdee-4861-9fd8-ff068d4d740c": "Sr5tjR2oQHf" },
  { "0b888b3c-df20-467c-9be9-0e68b779a97d": "VsEnL2R7crc" },
  { "cceda879-286d-4dca-8ea8-1168f217fd1c": "VuZnWho10cr" },
  { "0d52c378-adeb-4c89-a977-1f6cc4a7e9e4": "i5f4SA6TGRt" },
  { "e5dbe475-9116-4ed6-9349-6ab652bf9b13": "aALfEtMhQbD" },
  { "535dcc8a-71fb-47a1-89c6-1e0247ac4b6b": "KoBWJrNz0wM" },
  { "4db56fa7-e8cc-4ab4-b1bb-22a603dfdb35": "vYReWqiCniP" },
  { "5a3402d4-983b-4015-b673-5d76b6a7beef": "TyZkSOjZczV" },
  { "55bf58e2-48ff-41cf-a4a4-4b4feba2a140": "YRAKNkQqLE0" },
  { "12beb608-5f22-43d1-afc0-f7aef355051d": "XrI9DVozzi8" },
  { "2138c5f5-ce1d-4e96-9b9b-c1ca6fc21510": "TJ4eVIVbxgL" },
  { "e7664ff5-a8ab-47a2-bc29-4470636a5634": "GE0hAdM6xMg" },
  { "d12bec46-f525-41b2-99c6-bd51bda4046c": "gD4MJ7POPEz" },
  { "f7908667-e296-4be4-b41e-26bc4b5ceccb": "OG01ZScE7Xb" },
  { "ab6fcd11-6531-4fcf-bfb2-a214b88c0d29": "zwjBu20ltE5" },
  { "80530ec0-b820-4fe8-9d12-9d1f6476b0bf": "UXx7mkioReb" },
  { "c1ef1230-a9f7-4593-bdc8-1e9a08d45968": "ld7eCEmHmL0" },
  { "5e053da8-f8ac-4f4d-902f-dba756a312a5": "V85Z8rIMnOO" },
  { "e7fbe2c7-b9c4-4caa-83f3-3fc327a225c4": "RwjddwTRVM4" },
  { "35de662a-63de-4dbc-92c4-2b08165406ab": "IuNYK8OIZYq" },
  { "d195e749-fa4a-43e3-8ceb-a72f25fb2be4": "jdo1YiXyfKn" },
  { "6c93ead4-d189-4476-a81d-1bef16bda6a4": "PCJldbuZKlB" },
  { "8919a43c-fdee-4861-9fd8-ff068d4d740c": "BN8qSnZM57k" },
  { "5ba1d72e-8a77-4ad3-824e-19006bbf05e7": "SUL0FdHdNyq" },
  { "bd3649bd-8c55-4671-a9d1-d1515ca2877f": "OsZRlnXq7Qk" },
  { "c86a2bcc-638b-4696-a2ac-1a74a1781745": "yRpn8oL0vxv" },
  { "3cd3a7a2-26fe-102b-80cb-0017a47871b2": "HgLe4Xenycn" },
  { "3cd28732-26fe-102b-80cb-0017a47871b2": "YEOVngsByWK" },
  { "0fbbc915-2550-4de8-93a0-1661ad7b45b8": "r1PVDg5nIGZ" },
  { "7bfac55f-4ae4-4f4a-a597-5584e8be6020": "iTx0txf0FVj" },
  { "e328e0b0-28c3-44c9-9b2a-5f16b5185e2c": "jJxPUCWKW1K" },
  { "c1063a9d-515b-440a-af6a-89375cb44ca0": "y0Z5EVxKowc" },
  { "3ce84c8e-26fe-102b-80cb-0017a47871b2": "dP9kDCGW6C1" },
  { "3ce84b1c-26fe-102b-80cb-0017a47871b2": "SdIpSKZhA6a" },
  { "78240034-73f3-46d8-b688-81fb99f27056": "mzWU3p77ybU" },
  { "a71fff61-4db8-43ce-98f8-5de7f689f560": "ABFDAJwKeRZ" },
  { "e42027db-5008-4cb0-8131-af2d84f59734": "C58YCNuA64x" },
  { "ca27eadb-c14d-414e-8db9-694b3831e719": "zDFb1kASBZ8" },
  { "a8415b6a-065d-4cd6-9c70-4cdcec7bf8ef": "gTyCR0HFnjp" },
  { "f95bdebd-c174-4eaa-86cf-067f78db5364": "c6lPSpoY2T5" },
  { "825ee96c-5277-4b29-bece-7d94e654da34": "LUcOAQklmNQ" },
  { "7f0dd8e6-f0c3-4cb1-a81e-24391fc7200b": "S9NJxxEdqyk" },
  { "98463468-4bc0-4df0-8b78-ad5e208c5d2a": "BRDfNrkhRRW" },
  { "1394d37f-38ca-4f8a-a486-ac46e0ed7523": "XJERkeIHfcE" },
  { "d0385b0e-c9ac-4f63-ab8d-b6273c029f9d": "iKzBZiMwvGw" },
  { "3cd3a7a2-26fe-102b-80cb-0017a47871b2": "ITvtdUBslbU" },
  { "3cd28732-26fe-102b-80cb-0017a47871b2": "Pey8Tb56rwN" },
  { "3cd6fac4-26fe-102b-80cb-0017a47871b2": "kNRJ08nuqpC" },
  { "3cd6f600-26fe-102b-80cb-0017a47871b2": "C2BW6i7KIr9" },
  { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "R4fVlOAVmEw" },
  { "c1ef1230-a9f7-4593-bdc8-1e9a08d45968": "AbJydX5nX3k" },
  { "5e053da8-f8ac-4f4d-902f-dba756a312a5": "IV8M4e6l5oI" },
  { "e7fbe2c7-b9c4-4caa-83f3-3fc327a225c4": "Fl4NhPnptVk" },
  { "35de662a-63de-4dbc-92c4-2b08165406ab": "loFQ4dZf0eq" },
  { "d195e749-fa4a-43e3-8ceb-a72f25fb2be4": "MCTcHYKya23" },
  { "6c93ead4-d189-4476-a81d-1bef16bda6a4": "PVLjZ2ZWQVS" },
  { "8919a43c-fdee-4861-9fd8-ff068d4d740c": "Sr5tjR2oQHf" },
  { "e5dbe475-9116-4ed6-9349-6ab652bf9b13": "aALfEtMhQbD" },
  { "535dcc8a-71fb-47a1-89c6-1e0247ac4b6b": "KoBWJrNz0wM" },
  { "4db56fa7-e8cc-4ab4-b1bb-22a603dfdb35": "vYReWqiCniP" },
  { "5a3402d4-983b-4015-b673-5d76b6a7beef": "TyZkSOjZczV" },
  { "55bf58e2-48ff-41cf-a4a4-4b4feba2a140": "YRAKNkQqLE0" },
  { "12beb608-5f22-43d1-afc0-f7aef355051d": "XrI9DVozzi8" },
  { "2138c5f5-ce1d-4e96-9b9b-c1ca6fc21510": "TJ4eVIVbxgL" },
  { "d12bec46-f525-41b2-99c6-bd51bda4046c": "gD4MJ7POPEz" },
  { "f7908667-e296-4be4-b41e-26bc4b5ceccb": "OG01ZScE7Xb" },
  { "ab6fcd11-6531-4fcf-bfb2-a214b88c0d29": "zwjBu20ltE5" }

  
];

exports.form2MappingTable = [
  {"43021ec7-dea2-48c9-aea2-fce89d6bcd8d" : "Frig0xURxjh" },
  {"054266d6-b451-496a-892e-9249d52a0d44" : "dIAODvHtlhX" },
  {"48a489e3-37f1-40df-8e7b-a2e7ba2371ec" : "NmD5WModmzT" },
  {"6e7401f4-ed93-4c3f-a208-73ec7a1a9126" : "z9gpetn6EdK" },
  { "3ce84c8e-26fe-102b-80cb-0017a47871b2": "dP9kDCGW6C1" },
  { "3ce84b1c-26fe-102b-80cb-0017a47871b2": "SdIpSKZhA6a" },
  { "b45597da-318b-4dde-858b-da16f5950686": "qycXEyMMFMb" },
  { "87842c52-dc3d-41d7-9baa-9c0da45c5df4": "EWjLBp7rpZf" },
  { "c7df527f-eef0-4cdc-b142-c5a387b4c363": "rFmwPYhSTmm" },
  { "06de84ee-6deb-4d33-b2b6-bc680a73939c": "xHo7COhyMKM" },
  { "a17088c6-ea9e-4bf6-96ef-85cf9f06d432": "MyMV3TTWYmW" },
  { "3cdca69a-26fe-102b-80cb-0017a47871b2": "G0Jq8kyaJCD" },
  { "788e9f4c-5ba4-4a42-9974-83ea7128f0f8": "SzvTcCTNlGo" },
  { "3cd6f600-26fe-102b-80cb-0017a47871b2": "SjvT6az0YMa" },
  { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "AHH8ZhIlQ9z" },
  { "c6d3d50b-d2a8-4d15-bfcc-c0c36e34f659": "oZhzCABE3Pr" },
  { "b4b0e241-e41a-4d46-89dd-e531cf6d8202": "NZe43UAOGmt" },
  { "819f5ebe-0b3e-44ba-b435-8f3d1b7bb130": "J9MtIYciHSh" },
  { "3cd28732-26fe-102b-80cb-0017a47871b2": "FPSW8E0pHU9" },
  { "9340dede-5124-49cf-9b3c-5153cc0e537f": "mdAUkRi9txc" },
  { "fb3b2a61-4f4b-46b2-9187-9ec769349a44": "DlNtNOCwYMB" },
  { "b195b807-2213-4831-aeb8-0ac03cd139e4": "fHHFiV0HP0V" },
  { "d37d8242-2626-4404-94fd-5e78877457ab": "fB1hxxwcdye" },
  { "8191ff34-f72e-4f67-af0a-82acebca682a": "ZfoeEa3kNYe" },
  { "a116b5b4-8973-43ac-8007-c070b4199a53": "gJ58M7ClaMm" },
  { "a239017b-7bc1-421e-b348-d526e7ebd9d7": "yGhEu1ntCaf" },
  { "8726f435-566e-4c98-920d-b93ce22224b7": "eQFf5SRscrT" },
  { "efab937b-853e-47da-b97e-220f1bdff97d": "MABnwD1nt3B" },
  { "3cd6df26-26fe-102b-80cb-0017a47871b2": "PZo2sP0TOb6" },
  { "3cee0aca-26fe-102b-80cb-0017a47871b2": "fBMDDNWcRmw" },
  { "df488243-d1d5-4b50-ae04-40b4ffdcf934": "jREI0QafwGi" },
  { "3cd6e6f6-26fe-102b-80cb-0017a47871b2": "hnIhYohBRIY" },
  { "3cd6e96c-26fe-102b-80cb-0017a47871b2": "cifrFF43poD" },
  { "151a4503-8b27-4d17-9ebf-a94cdf02e028": "KY4a5xCSKgT" },
  { "0a48138e-f478-4ad7-bb10-d9efdbf9fe27": "LOYaimPK3ky" },
  { "2b9fd535-2222-4418-9249-ddb851362424": "u6TRk2Z7yws" },
  { "d261f305-93ee-47ef-a327-0243783637e0": "EurkobCvjG4" },
  { "8fa7c91c-5865-4216-bc10-f8857f116556": "hWsM7iCZ2Na" },
  { "3cdc8426-26fe-102b-80cb-0017a47871b2": "wxGTnGvzPcf" },
  { "0cf3bed0-e76a-4b0a-8e11-c61c945a0551": "RDQB5Zx8hMH" },
  { "5f2ce4b3-dc0f-4345-98ad-4177329b2388": "jYMNto3ELj5" },
  { "d3892b43-18be-4870-8d9b-02f5318f9cd5": "aYhoeOchJYM" },
  { "e4a2d73e-fa66-42cf-b9e4-c61da0fb041a": "ZcjMMzq1Dcv" },
  { "8fa7c91c-5865-4216-bc10-f8857f116556": "Uuj3Wc8u7Az" },
  { "41c410a4-18a4-4221-98ad-1daf1b22de4d": "GIC3Oq7ruS0" },
  { "59525e15-fc5e-4bc4-9e29-87954348c15f": "ZvH6DY75uR1" },
  { "48a489e3-37f1-40df-8e7b-a2e7ba2371ec": "vT0iGs8IW51" },
  { "3cd6e246-26fe-102b-80cb-0017a47871b2": "GglecqlxEWq" },
  { "4587542b-f1aa-47ad-8bed-75a705433950": "NrWXvZg3WtW" },
  { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "JUyi47p8XCc" },
  { "3cd6f600-26fe-102b-80cb-0017a47871b2": "gdiI0dcLkXv" },
  { "3cd97286-26fe-102b-80cb-0017a47871b2": "Cgt39EInKQV" },
  { "3cd9757e-26fe-102b-80cb-0017a47871b2": "W5jXNN7ugjW" },
  { "3cd976f0-26fe-102b-80cb-0017a47871b2": "FB6f2GGlkuB" },
  { "75efa569-f095-4caf-9a44-f8d8e4564a4a": "SNAaIVKCh78" },
  { "93721b11-0a32-44a3-8b4e-64664becffb8": "eUVdYRa8qUo" },
  { "e06cffdb-024c-45af-b148-fa275d368fc0": "VQPCeakHIpV" },
  
  
  { "5119a7e8-d4c6-4380-8c12-420cb3deff4d": "NFOu3OCGMKl" },
  { "3cd6f600-26fe-102b-80cb-0017a47871b2": "I7B4r9m1iIZ" },
  { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "g9WSz3pDHf1" },
  { "f97c7656-6369-426a-9597-b3fb9acf25af": "i7AuzJQFo8O" },
  
  { "a80a32ae-7683-49cd-abda-1cd946f0f445": "DDHl9CtiqaC" },
  { "e9b54b65-0880-47fd-b7ac-59a33b586312": "ocgzZ6BdT8W" },
  { "a1ce679f-1f65-468c-97c3-c81d7ff38399": "ZodoxM8PakE" },
  { "c341a733-630f-420f-ace6-80f6d463bc39": "kJIuYQpa9Lc" },
  { "403b928f-1fcf-458b-93d9-74c04f4c0fbc": "ivqLch0DMXv" },
  { "97533455-8642-4b0a-947a-f730bf39da09": "gNjou1Bq6dz" },
  { "bf6340df-3048-497b-9afe-3c574db3b362": "xODDyc7G5bz" },
  { "58e3707d-3310-4560-b7a8-ad963ad302cb": "c5v4ICtJ3wn" },
  { "8f77f097-f2d4-4c26-97c6-a32863dd2dec": "NWhBWwl7RqM" },
  { "39cecd62-41b5-4673-a6aa-54cb5fd1246b": "NUbmYicRCUp" },
  { "3c4ef122-ce21-4b2f-b9e7-65f5d84a7758": "nOenSUVffWd" },
  { "3c4ef122-ce21-4b2f-b9e7-65f5d84a7758": "pGmLtnqqn6c" },
  { "f47620e7-a45f-4b29-a3b3-7bcd6958e7a4": "cE0JLRDspz9" }



]

exports.form3MappingTable = [
  { "3ce2ad10-26fe-102b-80cb-0017a47871b2": "OO8wNkgpAwK" },
  { "3cdef3d2-26fe-102b-80cb-0017a47871b2": "MBJmU3rhpPm" },
  { "3cdef54e-26fe-102b-80cb-0017a47871b2": "nek4WjtVfoT" },
  { "3cdef6c0-26fe-102b-80cb-0017a47871b2": "DftFE82Ae65" },
  { "f0e8e8a2-11a9-4c58-87f1-daee5c284183": "lrM4jhiDogd" },
  { "3ceb0ed8-26fe-102b-80cb-0017a47871b2": "UKKOKMZFOx0" },
  { "9034caa2-843e-4124-b64d-71b1fffd9ff0": "yzNVLmfly35" },
  { "3cdc0d7a-26fe-102b-80cb-0017a47871b2": "gH0EgH6sS1Z" },
  { "5269c451-2a5a-4a54-ac8b-bae388e58a82": "hwYeeeJWm3T" },
  { "08176d5d-3cbe-4c40-8436-26b2e26a1acf": "weBH1mytURu" },
  { "e63265dd-9b1c-4dc5-abfe-85863afcf4e3": "OCZt4UJitnh" },
  { "89881216-5a02-4e7f-8a01-a2fa38acd465": "KrYJW9kvJS2" },
  { "ced94af8-ec16-489f-8e73-a02256b35601": "Nld1zMZwPxK" },
  { "5f2ce4b3-dc0f-4345-98ad-4177329b2388": "jYMNto3ELj5" },
  { "3ce3fc4c-26fe-102b-80cb-0017a47871b2": "xMLGFpVb0Kh" },
  { "f47620e7-a45f-4b29-a3b3-7bcd6958e7a4": "cE0JLRDspz9" },
  { "3cd919c6-26fe-102b-80cb-0017a47871b2": "Nxu3IZxrngL" },
  { "3cd49432-26fe-102b-80cb-0017a47871b2": "MvibOcy7W7e" },
  { "e9f7f336-1b02-4734-99bd-3cb15fa4a2b6": "NlC64TrTfJ8" },
  { "3cde143a-26fe-102b-80cb-0017a47871b2": "lMWlaQJHTru" },
  { "3cdd8132-26fe-102b-80cb-0017a47871b2": "sxPyoZKD95U" },
  { "3cccecdc-26fe-102b-80cb-0017a47871b2": "ADFsRPLCDTt" },
  { "3cee7fb4-26fe-102b-80cb-0017a47871b2": "QIu05NTRtG4" },
  { "48a60bc9-6b67-47e7-8717-84a32840180a": "dlbRyDDWVdz" },
  { "cf6b3ef3-d38a-11e8-b6e2-0c5b8f279a64": "IpoRdq5ZtH6" },
  { "918b11a8-bbd8-44d5-9ba5-24bfac4b6a3d": "PJKFHFjoLcW" },
  { "3ce5c888-26fe-102b-80cb-0017a47871b2": "fXUEeymr6Sb" },
  { "47f1a68d-6b39-4101-95f0-ae0339a8c0ba": "EwvsL6PlHfD" },
  { "36443d87-b8bb-44e4-857b-9b7d9601e33f": "gZLYfulH1cx" },
  { "5269c451-2a5a-4a54-ac8b-bae388e58a82": "L9lcjEkxHBv" },
  { "a18bc25f-1757-4568-88a7-d58c4100f7f2": "eCbwnVkQ8Rt" },
  { "6d024c01-dc13-4074-b493-ba72bdb0739e": "yH3otrjN0qZ" },
  { "1e20e234-51d0-47a9-89b2-b359d8520481": "ldCad6nQhDx" },
  { "35b9992e-c5e4-464c-b800-969adcfee12c": "NJPbN9YatIa" },
  { "106e1e0a-40a8-4fcc-9e58-96f69a3693b6": "BMf4geBAMFU" },
  { "35b9992e-c5e4-464c-b800-969adcfee12c": "nQGHwHA3ayC" },
  { "3cdbfbc8-26fe-102b-80cb-0017a47871b2": "Gcj9CC1xD4e" },
  { "3cd96052-26fe-102b-80cb-0017a47871b2": "ZZzqnrkube2" },
  { "3ccca7cc-26fe-102b-80cb-0017a47871b2": "ChxoqpOQnwh" },
  { "ebc286a5-5b09-4960-b1c0-cf76108b70da": "ROD5srkOABi" },
  { "cf6b2d18-d38a-11e8-b6e2-0c5b8f279a64": "h5HoO3NbRSw" },
  { "08176d5d-3cbe-4c40-8436-26b2e26a1acf": "wjqRdfo6VRP" },
  { "106e1e0a-40a8-4fcc-9e58-96f69a3693b6": "LpDBQwhUZ4U" },
  { "85a6d158-55ed-4a5f-ac52-ed3ac908afec": "EBAuC7pMu4O" },

]

exports.form4MappingTable = [
  { "a2053e28-9ce9-4647-8a96-6f1b7c62f429": "qBYsHDuUBIv" },
  { "ba4b8a83-54ab-44f3-a7c5-4495ddf055bc": "nMJKcTFHGj0" },
  { "fa87bb43-ebcc-4919-96f8-c5013ce1bbca": "Ba8VCAO9Nqi" },
  { "aae8d7fe-8bbc-4d2e-926c-0e28b4d0e046": "yu2bxd3xVIg" },
  { "f4e3f60a-2f62-47bc-b968-156b3df91067": "ptZMCKSxvU8" }
  
]

exports.form1MappingBooleanTable = [
  { "5d90078d-43d5-4ea1-9bf6-cda5398d1d67": "mfAyPSJA74t" }
]

exports.form2MappingBooleanTable = [
  { "0cf3bed0-e76a-4b0a-8e11-c61c945a0551": "RDQB5Zx8hMH" },
  { "5f2ce4b3-dc0f-4345-98ad-4177329b2388": "jYMNto3ELj5" }
]

exports.districts = [
  { "Nyarugenge": "jqrJGsWovJs" },
  { "Gasabo": "fSyvbMUZWqJ" },
  { "Kicukiro": "rEmeA5Z7HcP" },
  { "Nyanza": "MJ0JLxsTP70" },
  { "Gisagara": "N9pKxz10nwa" },
  { "Nyaruguru": "lU5vBlNgAW5" },
  { "Nyamagabe": "jy5judMZtzS" },
  { "Ruhango": "n95lDV3pgL5" },
  { "Muhanga": "zuLjFsLTx2m" },
  { "Kamonyi": "vb9Wtsjv0OS" },
  { "Karongi": "DJKWdcLdPOI" },
  { "Rutsiro": "DG8h5ijGxgO" },
  { "Nyabihu": "ARCA1tta4rF" },
  { "Ngororero": "urGSAaskBqL" },
  { "Rusizi": "M6o8DrKq6P3" },
  { "Nyamasheke": "PBHtCUM6nkg" },
  { "Rulindo": "BtzzCdcgFli" },
  { "Gakenke": "pXalpffB0lo" },
  { "Musanze": "rNmqHqUm4Cf" },
  { "Burera": "bFXwg69YOeD" },
  { "Gicumbi": "o5Gxx8zOilJ" },
  { "Rwamagana": "PnnZRLwoD66" },
  { "Nyagatare": "QMTKhz1j2mA" },
  { "Gatsibo": "WOjncnBz0hi" },
  { "Kayonza": "fcW5X82FfpG" },
  { "Kirehe": "VqMwIodXtFZ" },
  { "Ngoma": "ERRCgvW7La1" },
  { "Bugesera": "XxBlJkEmJGQ" }
]

exports.provinces = [
  { "Kigali Province": "nBLRIqKNNOu" },
  { "Southern Province/Amajyepfo": "qICVQ5VD0Y7" },
  { "Western Province/Uburengerazuba": "psfB4ksRKp2" },
  { "Northern Province/Amajyaruguru": "tuaLIYpCQzv" },
  { "Eastern Province/Uburasirazuba": "jUMVwrUlNqG" }
]

exports.pushFormToDhis2 = function (mappingTable, incomingEncounter, dhsi2Json, index, booleanMappingTable, callback) {

  if (utils.isFineValue(dhsi2Json) == true && utils.isFineValue(dhsi2Json) == true) {
    var dataValues = [];
    function myLoopA(i) {
      if (i < dhsi2Json.dataValues.length) {
        if (utils.isFineValue(dhsi2Json.dataValues[i].value) == true) {
          dataValues.push({ "dataElement": dhsi2Json.dataValues[i].dataElement, "value": dhsi2Json.dataValues[i].value })
          myLoopA(i + 1);
        } else {
          exports.getValue(mappingTable, incomingEncounter.encounter.obs, booleanMappingTable, dhsi2Json.dataValues[i].dataElement, function (result) {
            console.log("The result = " + result);
            dataValues.push({ "dataElement": dhsi2Json.dataValues[i].dataElement, "value": result });
            myLoopA(i + 1);
         });
        }
      } else {

        dhsi2Json.dataValues = dataValues;
        var options = {
          url: apiConf.api.dhis2.url + "/api/events",
          headers: {
            'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dhsi2Json),
        };
        if (apiConf.verbose == true) {
          if (index == 1) {
            console.log("--> HIV CASE-BASED SURVEILLANCE,Index testing: ", options.body);
          }

          if (index == 2) {
            console.log("--> HIV CASE-BASED SURVEILLANCE,partner notification: ", options.body);
          }

          if (index == 3) {
            console.log("--> HIV CASE-BASED SURVEILLANCE,recency testing: ", options.body);
          }


          if (index == 4) {
            console.log("--> Confidential HIV CRF - SECTION 1: Enrollment Information ", options.body);
          }


          if (index == 5) {
            console.log("--> Confidential HIV CRF - SECTION II: Follow up Information ", options.body);
          }

          if (index == 6) {
            console.log("--> CBS Recency VL ", options.body);
          }
        }

        request.post(options, function (error, response, body) {
          if (error) {
            callback(error);
          } else {
            var ResponseBody = JSON.parse(body);
            if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.httpStatusCode) == true) {
              if (ResponseBody.httpStatusCode == 200) {
                callback(null, ResponseBody.response.importSummaries[0].reference)
              } else {
                if (apiConf.verbose == true) {
                  console.log("--> Error response ", JSON.stringify(ResponseBody));
                }

                if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.response) == true) {
                  if (utils.isFineValue(ResponseBody.response.importSummaries) == true && utils.isFineValue(ResponseBody.response.importSummaries[0].conflicts) == true) {
                    callback(ResponseBody.message + ' ' + JSON.stringify(ResponseBody.response.importSummaries[0].conflicts[0].object) + " : " + JSON.stringify(ResponseBody.response.importSummaries[0].conflicts[0].value));
                  } else {
                    callback(ResponseBody.message + ' ' + JSON.stringify(ResponseBody.response.importSummaries[0].description));
                  }
                } else {
                  callback(ResponseBody.message, null);
                }
              }
            } else {
              callback('An error occured, the server returned an empty body when body', null);
            }
          }
        });
      }
    }
    myLoopA(0);
  }
}

exports.getValue = function (mappingTable, obsListing, booleanMappingTable, dhis2Id, callback) {

  var mapItem = _.find(mappingTable, function (item) {
    return Object.values(item) == dhis2Id;
  });

  console.log("mapItem  : " + mapItem);

  if (utils.isFineValue(mapItem) == true) {
    var mapItemKey = Object.keys(mapItem);
    console.log("mapItemKey[0]  : " + mapItemKey[0])

    var obs = _.find(obsListing, function (ob) {
      return ob.concept.uuid == mapItemKey[0];
    });

    console.log("obs   : " + obs);

    if (utils.isFineValue(obs) == true && utils.isFineValue(obs.display) == true) {
      if (obs.display.includes(":")) { //ensure value not null ("display": "RECENCY SAMPLE COLLECTION DATE: 2019-12-30")
        //Check the existence of the obs's value for the concept
        if (utils.isFineValue(obs.value) == true) {

          // check if the value is on the boolean mapping
          var booleanConcept = _.find(booleanMappingTable, function (item) {
            return Object.values(item) == dhis2Id;
          });
        
          if (utils.isFineValue(booleanConcept) == true) {
            callback(utils.convertToBoolean(obs.value.name.name));
          } else {
            if (utils.isDate(obs.value) == true) {
              callback(utils.convertToDate(obs.value));
            } else {
                if (utils.isNumeric(obs.value) == true) {
                  callback(utils.convertToNumber(obs.value));
                } else {
                  if (utils.isString(obs.value) == true) {
                    callback(obs.value);
                  } else {
                    //dropdown value processing place
                    if(utils.isObject(obs.value) === true){
                      var idDhis2 = "";
                      //Find the right DHIS2 id and concept uuid
                      var mappingItem = _.find(mappingTable, function (item) {
                        return Object.keys(item) == obs.value.uuid;
                      });
                      //Retrieve DHIS2 dropdown value
                      if(utils.isFineValue(mappingItem) === true){
                        /*idDhis2 = Object.values(mappingItem);
                        //Return the dropdown value : dhis2 option code
                        utils.getDhis2DropdownValue(idDhis2, function(result){
                          callback(result);
                        }); */
                        callback("");
                      }
                      callback("");
                    } else {
                      console.log("-> ", obs.value, " is a wierd");
                      callback("");
                    }
                  }
                }
              }
            }
          } else {
              callback("");
          }
      } else {
          callback("");
      }
    } else {
        callback("");
    }
  } else {
      callback("");
  }
}

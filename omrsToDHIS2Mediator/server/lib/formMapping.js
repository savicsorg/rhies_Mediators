'use strict'
const URI = require('urijs')
const _ = require('underscore');
const utils = require('./utils')
const apiConf = process.env.NODE_ENV === 'test' ? require('../config/test') : require('../config/config')
const winston = require('winston');
var request = require('request');


exports.form1MappingTable = [
  { "badacf97-0970-4dde-aee4-5e1c2bb125f7": "ijTurgFUOPq" },
  { "3ce498dc-26fe-102b-80cb-0017a47871b2": "ISfxedlVq7Y" },
  { "f4e3f60a-2f62-47bc-b968-156b3df91067": "K4l00GKVInN" },
  { "b4b0e241-e41a-4d46-89dd-e531cf6d8202": "W58gazENRqS" },
  { "12beb608-5f22-43d1-afc0-f7aef355051d": "buRJTweOy6h" },
  { "fe5fdddf-96ee-42af-9b36-0ab8c3ddd05d": "KX4MrpcRuAb" },
  { "3cee2924-26fe-102b-80cb-0017a47871b2": "xHo7COhyMKM" },
  { "504e851d-8a95-4f0f-bcad-ca081a975abf": "GyqLOJRotuL" },
  { "d1ecd154-13b1-433a-8480-3213e178aff7": "m3pQUNk6AeL" },
  { "d4a45c62-5d82-43a2-856d-6c75db9fe842": "Zxkghqkbn7p" },
  { "78240034-73f3-46d8-b688-81fb99f27056": "mzWU3p77ybU" },
  { "a71fff61-4db8-43ce-98f8-5de7f689f560": "ABFDAJwKeRZ" },
  { "8d234f0f-c299-42e5-8edf-f2460e64704e": "C58YCNuA64x" },
  { "ca27eadb-c14d-414e-8db9-694b3831e719": "zDFb1kASBZ8" },
  { "a8415b6a-065d-4cd6-9c70-4cdcec7bf8ef": "gTyCR0HFnjp" },
  { "f95bdebd-c174-4eaa-86cf-067f78db5364": "c6lPSpoY2T5" },
  { "825ee96c-5277-4b29-bece-7d94e654da34": "LUcOAQklmNQ" },
  { "7f0dd8e6-f0c3-4cb1-a81e-24391fc7200b": "S9NJxxEdqyk" },
  { "98463468-4bc0-4df0-8b78-ad5e208c5d2a": "BRDfNrkhRRW" },
  { "1394d37f-38ca-4f8a-a486-ac46e0ed7523": "XJERkeIHfcE" },
  { "d0385b0e-c9ac-4f63-ab8d-b6273c029f9d": "iKzBZiMwvGw" },
  { "438e1ee2-5642-4868-867d-960eca6e6451": "scledbnTVVK" },
  { "5d90078d-43d5-4ea1-9bf6-cda5398d1d67": "mfAyPSJA74t" },
  { "3cd6f600-26fe-102b-80cb-0017a47871b2": "R4fVlOAVmEw" },
  { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "C2BW6i7KIr9" },
  { "d300cfbb-c771-44db-8272-7065efc88242": "iz0c8aW79QH" },
  { "c1ef1230-a9f7-4593-bdc8-1e9a08d45968": "AbJydX5nX3k" },
  { "5e053da8-f8ac-4f4d-902f-dba756a312a5": "IV8M4e6l5oI" },
  { "e7fbe2c7-b9c4-4caa-83f3-3fc327a225c4": "Fl4NhPnptVk" },
  { "35de662a-63de-4dbc-92c4-2b08165406ab": "loFQ4dZf0eq" },
  { "d195e749-fa4a-43e3-8ceb-a72f25fb2be4": "MCTcHYKya23" },
  { "6c93ead4-d189-4476-a81d-1bef16bda6a4": "PVLjZ2ZWQVS" },
  { "8919a43c-fdee-4861-9fd8-ff068d4d740c": "Sr5tjR2oQHf" },
  { "0b888b3c-df20-467c-9be9-0e68b779a97d": "VsEnL2R7crc" },
  { "3cd6f600-26fe-102b-80cb-0017a47871b2": "R4fVlOAVmEw" },
  { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "C2BW6i7KIr9" },
  { "3cd6f600-26fe-102b-80cb-0017a47871b2": "R4fVlOAVmEw" },
  { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "C2BW6i7KIr9" },
  { "0d52c378-adeb-4c89-a977-1f6cc4a7e9e4": "i5f4SA6TGRt" },
  { "e5dbe475-9116-4ed6-9349-6ab652bf9b13": "aALfEtMhQbD" },
  { "535dcc8a-71fb-47a1-89c6-1e0247ac4b6b": "KoBWJrNz0wM" },
  { "4db56fa7-e8cc-4ab4-b1bb-22a603dfdb35": "vYReWqiCniP" },
  { "5a3402d4-983b-4015-b673-5d76b6a7beef": "TyZkSOjZczV" },
  { "55bf58e2-48ff-41cf-a4a4-4b4feba2a140": "YRAKNkQqLE0" },
  { "12beb608-5f22-43d1-afc0-f7aef355051d": "XrI9DVozzi8" },
  { "2138c5f5-ce1d-4e96-9b9b-c1ca6fc21510": "TJ4eVIVbxgL" },
  { "d12bec46-f525-41b2-99c6-bd51bda4046c": "GE0hAdM6xMg" },
  { "d12bec46-f525-41b2-99c6-bd51bda4046c": "gD4MJ7POPEz" },
  { "ab6fcd11-6531-4fcf-bfb2-a214b88c0d29": "OG01ZScE7Xb" },
  { "ab6fcd11-6531-4fcf-bfb2-a214b88c0d29": "zwjBu20ltE5" },
  { "c1ef1230-a9f7-4593-bdc8-1e9a08d45968": "ld7eCEmHmL0" },
  { "5e053da8-f8ac-4f4d-902f-dba756a312a5": "V85Z8rIMnOO" },
  { "e7fbe2c7-b9c4-4caa-83f3-3fc327a225c4": "RwjddwTRVM4" },
  { "35de662a-63de-4dbc-92c4-2b08165406ab": "IuNYK8OIZYq" },
  { "d195e749-fa4a-43e3-8ceb-a72f25fb2be4": "jdo1YiXyfKn" },
  { "6c93ead4-d189-4476-a81d-1bef16bda6a4": "PCJldbuZKlB" },
  { "8919a43c-fdee-4861-9fd8-ff068d4d740c": "BN8qSnZM57k" },
  { "5ba1d72e-8a77-4ad3-824e-19006bbf05e7": "SUL0FdHdNyq" },
  { "3cd6f600-26fe-102b-80cb-0017a47871b2": "R4fVlOAVmEw" },
  { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "C2BW6i7KIr9" },
  { "bd3649bd-8c55-4671-a9d1-d1515ca2877f": "OsZRlnXq7Qk" },
  { "d12bec46-f525-41b2-99c6-bd51bda4046c": "gD4MJ7POPEz" },
  { "ab6fcd11-6531-4fcf-bfb2-a214b88c0d29": "OG01ZScE7Xb" },
  { "ab6fcd11-6531-4fcf-bfb2-a214b88c0d29": "zwjBu20ltE5" },
  { "c86a2bcc-638b-4696-a2ac-1a74a1781745": "yRpn8oL0vxv" },
  { "3cd28732-26fe-102b-80cb-0017a47871b2": "YEOVngsByWK" },
  { "3cd3a7a2-26fe-102b-80cb-0017a47871b2": "HgLe4Xenycn" },
  { "3cd6f600-26fe-102b-80cb-0017a47871b2": "R4fVlOAVmEw" },
  { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "C2BW6i7KIr9" },
  { "7bfac55f-4ae4-4f4a-a597-5584e8be6020": "iTx0txf0FVj" },
  { "3cd6f600-26fe-102b-80cb-0017a47871b2": "R4fVlOAVmEw" },
  { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "C2BW6i7KIr9" }
];

exports.form2MappingTable =
  [
    { "c1063a9d-515b-440a-af6a-89375cb44ca0": "qycXEyMMFMb" },
    { "80530ec0-b820-4fe8-9d12-9d1f6476b0bf": "rFmwPYhSTmm" },
    { "41c410a4-18a4-4221-98ad-1daf1b22de4d": "EWjLBp7rpZf" },
    { "c7df527f-eef0-4cdc-b142-c5a387b4c363": "aYhoeOchJYM" },
    { "87842c52-dc3d-41d7-9baa-9c0da45c5df4": "ZcjMMzq1Dcv" },
    { "b45597da-318b-4dde-858b-da16f5950686": "Uuj3Wc8u7Az" },
    { "59525e15-fc5e-4bc4-9e29-87954348c15f": "ZvH6DY75uR1" },
    { "43021ec7-dea2-48c9-aea2-fce89d6bcd8d": "Frig0xURxjh" },
    { "054266d6-b451-496a-892e-9249d52a0d44": "dIAODvHtlhX" },
    { "48a489e3-37f1-40df-8e7b-a2e7ba2371ec": "NmD5WModmzT" },
    { "6e7401f4-ed93-4c3f-a208-73ec7a1a9126": "z9gpetn6EdK" },
    { "4587542b-f1aa-47ad-8bed-75a705433950": "NrWXvZg3WtW" },
    { "3cd97286-26fe-102b-80cb-0017a47871b2": "Cgt39EInKQV" },
    { "788e9f4c-5ba4-4a42-9974-83ea7128f0f8": "SzvTcCTNlGo" },
    { "3cd6f600-26fe-102b-80cb-0017a47871b2": "gt8qxD225Pw" },
    { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "x7GuGQEdbzx" },
    { "3cdca69a-26fe-102b-80cb-0017a47871b2": "G0Jq8kyaJCD" },
    { "06de84ee-6deb-4d33-b2b6-bc680a73939c": "xHo7COhyMKM" },
    { "a17088c6-ea9e-4bf6-96ef-85cf9f06d432": "MyMV3TTWYmW" },
    { "3cd6f600-26fe-102b-80cb-0017a47871b2": "SjvT6az0YMa" },
    { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "AHH8ZhIlQ9z" },
    { "3cd6fac4-26fe-102b-80cb-0017a47871b2": "oZhzCABE3Pr" },
    { "3cd6f600-26fe-102b-80cb-0017a47871b2": "SjvT6az0YMa" },
    { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "AHH8ZhIlQ9z" },
    { "3cd6fac4-26fe-102b-80cb-0017a47871b2": "oZhzCABE3Pr" },
    { "3cd6f600-26fe-102b-80cb-0017a47871b2": "SjvT6az0YMa" },
    { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "AHH8ZhIlQ9z" },
    { "3cd6fac4-26fe-102b-80cb-0017a47871b2": "oZhzCABE3Pr" },
    { "3cd6f600-26fe-102b-80cb-0017a47871b2": "SjvT6az0YMa" },
    { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "AHH8ZhIlQ9z" },
    { "3cd6fac4-26fe-102b-80cb-0017a47871b2": "oZhzCABE3Pr" },
    { "3cd6f600-26fe-102b-80cb-0017a47871b2": "SjvT6az0YMa" },
    { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "AHH8ZhIlQ9z" },
    { "3cd6fac4-26fe-102b-80cb-0017a47871b2": "oZhzCABE3Pr" },
    { "e06cffdb-024c-45af-b148-fa275d368fc0": "VQPCeakHIpV" },
    { "3cd6f600-26fe-102b-80cb-0017a47871b2": "I7B4r9m1iIZ" },
    { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "g9WSz3pDHf1" },
    { "5119a7e8-d4c6-4380-8c12-420cb3deff4d": "NFOu3OCGMKl" },
    { "b4b0e241-e41a-4d46-89dd-e531cf6d8202": "NZe43UAOGmt" },
    { "fb3b2a61-4f4b-46b2-9187-9ec769349a44": "DlNtNOCwYMB" },
    { "819f5ebe-0b3e-44ba-b435-8f3d1b7bb130": "J9MtIYciHSh" },
    { "9340dede-5124-49cf-9b3c-5153cc0e537f": "mdAUkRi9txc" },
    { "3cd28732-26fe-102b-80cb-0017a47871b2": "FPSW8E0pHU9" },
    { "c59b6935-3838-4198-8909-75f08d47ff2b": "ccYYcYf78sz" },
    { "3cd6f600-26fe-102b-80cb-0017a47871b2": "I7B4r9m1iIZ" },
    { "3cd6f86c-26fe-102b-80cb-0017a47871b2": "g9WSz3pDHf1" },
    { "774f49dc-cd95-4f7e-a20f-b38f9a1f52c4": "Ba8VCAO9Nqi" },
    { "aae8d7fe-8bbc-4d2e-926c-0e28b4d0e046": "yu2bxd3xVIg" },
    { "f4e3f60a-2f62-47bc-b968-156b3df91067": "ptZMCKSxvU8" },
    { "a80a32ae-7683-49cd-abda-1cd946f0f445": "DDHl9CtiqaC" },
    { "0cf3bed0-e76a-4b0a-8e11-c61c945a0551": "RDQB5Zx8hMH" },
    { "e9b54b65-0880-47fd-b7ac-59a33b586312": "ocgzZ6BdT8W" },
    { "a1ce679f-1f65-468c-97c3-c81d7ff38399": "ZodoxM8PakE" },
    { "ae57702c-dddf-4eff-b2a2-a7063a5d98bb": "ERqqYuUtigv" },
    { "c341a733-630f-420f-ace6-80f6d463bc39": "kJIuYQpa9Lc" },
    { "403b928f-1fcf-458b-93d9-74c04f4c0fbc": "ivqLch0DMXv" },
    { "97533455-8642-4b0a-947a-f730bf39da09": "gNjou1Bq6dz" },
    { "bf6340df-3048-497b-9afe-3c574db3b362": "xODDyc7G5bz" },
    { "58e3707d-3310-4560-b7a8-ad963ad302cb": "c5v4ICtJ3wn" },
    { "8f77f097-f2d4-4c26-97c6-a32863dd2dec": "NWhBWwl7RqM" },
    { "39cecd62-41b5-4673-a6aa-54cb5fd1246b": "NUbmYicRCUp" },
    { "3c4ef122-ce21-4b2f-b9e7-65f5d84a7758": "c5v4ICtJ3wn" },
    { "5f2ce4b3-dc0f-4345-98ad-4177329b2388": "jYMNto3ELj5" },
    { "aaa7aeff-c1cc-4c34-befc-0821c7f5e2e0": "eHhzvtf9EZc" },
    { "3cdc4d3a-26fe-102b-80cb-0017a47871b2": "TePgnlpuIED" },
    { "b85ee495-4aaa-4037-82ec-ccb781df9741": "rS0aSkgA3sV" },
    { "3cdc4a42-26fe-102b-80cb-0017a47871b2": "hp4GdmJusNl" },
    { "3cdc4ec0-26fe-102b-80cb-0017a47871b2": "HqR7xEVy7SB" },
    { "3cd43a64-26fe-102b-80cb-0017a47871b2": "WI9MgU7ZTEc" },
    { "e43b308c-a303-4524-b4bd-a728a9f52faf": "pCXZPKcWvKJ" },
    { "3ca5e860-a818-44d7-b986-893df2e85a98": "nZm9EEBriET" },
    { "898d8570-60ff-4f4c-aef3-547d6aa0d809": "tv6tZh1O2bV" },
    { "aaa7aeff-c1cc-4c34-befc-0821c7f5e2e0": "eHhzvtf9EZc" },
    { "3cdc4d3a-26fe-102b-80cb-0017a47871b2": "TePgnlpuIED" },
    { "b85ee495-4aaa-4037-82ec-ccb781df9741": "rS0aSkgA3sV" },
    { "3cdc4a42-26fe-102b-80cb-0017a47871b2": "hp4GdmJusNl" },
    { "3cdc4ec0-26fe-102b-80cb-0017a47871b2": "HqR7xEVy7SB" },
    { "3cd43a64-26fe-102b-80cb-0017a47871b2": "WI9MgU7ZTEc" },
    { "e43b308c-a303-4524-b4bd-a728a9f52faf": "pCXZPKcWvKJ" },
    { "3ca5e860-a818-44d7-b986-893df2e85a98": "nZm9EEBriET" },
    { "898d8570-60ff-4f4c-aef3-547d6aa0d809": "tv6tZh1O2bV" },
    { "f47620e7-a45f-4b29-a3b3-7bcd6958e7a4": "cE0JLRDspz9" },
    { "3cdb3b02-26fe-102b-80cb-0017a47871b2": "MWnDK640C17" },
    { "3cd7ee16-26fe-102b-80cb-0017a47871b2": "svKQ8CX1NG1" },
    { "3cd7ef9c-26fe-102b-80cb-0017a47871b2": "k5rhaBb4Vxl" },
    { "3cd7f118-26fe-102b-80cb-0017a47871b2": "i8AQ5keQ28R" },
    { "3cd7f294-26fe-102b-80cb-0017a47871b2": "oEspstl5HfP" },
    { "3ceda710-26fe-102b-80cb-0017a47871b2": "Qx0v2TzHlS0" },
    { "3cd4a882-26fe-102b-80cb-0017a47871b2": "Tgt3yKYd2oD" },
    { "a5694b2e-22f0-487d-a22d-06771ae6b82d": "G3dUs7PuDqx" }
  ]

exports.form3MappingTable = [
  { "59525e15-fc5e-4bc4-9e29-87954348c15f": "txsxKp2l6y9" },
  { "e63265dd-9b1c-4dc5-abfe-85863afcf4e3": "OCZt4UJitnh" },
  { "09926a9e-c926-4893-a8a1-bf942a3a321d": "yu67Iiw64UQ" },
  { "43021ec7-dea2-48c9-aea2-fce89d6bcd8d": "Frig0xURxjh" },
  { "054266d6-b451-496a-892e-9249d52a0d44": "dIAODvHtlhX" },
  { "48a489e3-37f1-40df-8e7b-a2e7ba2371ec": "NmD5WModmzT" },
  { "6e7401f4-ed93-4c3f-a208-73ec7a1a9126": "z9gpetn6EdK" },
  { "3cd97286-26fe-102b-80cb-0017a47871b2": "Cgt39EInKQV" },
  { "89881216-5a02-4e7f-8a01-a2fa38acd465": "KrYJW9kvJS2" },
  { "ced94af8-ec16-489f-8e73-a02256b35601": "Nld1zMZwPxK" },
  { "5f2ce4b3-dc0f-4345-98ad-4177329b2388": "jYMNto3ELj5" },
  { "aaa7aeff-c1cc-4c34-befc-0821c7f5e2e0": "eHhzvtf9EZc" },
  { "3cdc4d3a-26fe-102b-80cb-0017a47871b2": "TePgnlpuIED" },
  { "b85ee495-4aaa-4037-82ec-ccb781df9741": "rS0aSkgA3sV" },
  { "3cdc4a42-26fe-102b-80cb-0017a47871b2": "hp4GdmJusNl" },
  { "3cdc4ec0-26fe-102b-80cb-0017a47871b2": "HqR7xEVy7SB" },
  { "3cd43a64-26fe-102b-80cb-0017a47871b2": "WI9MgU7ZTEc" },
  { "e43b308c-a303-4524-b4bd-a728a9f52faf": "pCXZPKcWvKJ" },
  { "3ca5e860-a818-44d7-b986-893df2e85a98": "nZm9EEBriET" },
  { "898d8570-60ff-4f4c-aef3-547d6aa0d809": "tv6tZh1O2bV" },
  { "39853881-e392-4536-baa2-37bbd315adef": "KRTWX8CatfN" },
  { "3cd919c6-26fe-102b-80cb-0017a47871b2": "Nxu3IZxrngL" },
  { "3cd49432-26fe-102b-80cb-0017a47871b2": "MvibOcy7W7e" },
  { "e9f7f336-1b02-4734-99bd-3cb15fa4a2b6": "NlC64TrTfJ8" },
  { "3cde143a-26fe-102b-80cb-0017a47871b2": "lMWlaQJHTru" },
  { "3cdd8132-26fe-102b-80cb-0017a47871b2": "sxPyoZKD95U" },
  { "3cccecdc-26fe-102b-80cb-0017a47871b2": "ADFsRPLCDTt" },
  { "3ce85b48-26fe-102b-80cb-0017a47871b2": "pMXrQhnR15u" },
  { "3cf19000-26fe-102b-80cb-0017a47871b2": "dVm3plO6WA3" },
  { "ea4ec122-6195-4506-8c74-c8e6dea7fa66": "AfV9vFkt1vn" },
  { "cf6684a8-d38a-11e8-b6e2-0c5b8f279a64": "WkoLOTZzZbr" },
  { "3cd24178-26fe-102b-80cb-0017a47871b2": "ljSXXZlIchK" },
  { "620ecc25-2ece-410f-9df7-4a677e5142e7": "tE3dZGfkMDp" },
  { "3cd92330-26fe-102b-80cb-0017a47871b2": "MHwKIBgomot" },
  { "3cee7fb4-26fe-102b-80cb-0017a47871b2": "QIu05NTRtG4" },
  { "36443d87-b8bb-44e4-857b-9b7d9601e33f": "gZLYfulH1cx" },
  { "48a60bc9-6b67-47e7-8717-84a32840180a": "dlbRyDDWVdz" },
  { "cf6b3ef3-d38a-11e8-b6e2-0c5b8f279a64": "IpoRdq5ZtH6" },
  { "918b11a8-bbd8-44d5-9ba5-24bfac4b6a3d": "PJKFHFjoLcW" },
  { "3ce5c888-26fe-102b-80cb-0017a47871b2": "fXUEeymr6Sb" },
  { "47f1a68d-6b39-4101-95f0-ae0339a8c0ba": "EwvsL6PlHfD" },
  { "3cdb3b02-26fe-102b-80cb-0017a47871b2": "MWnDK640C17" },
  { "3cd7ee16-26fe-102b-80cb-0017a47871b2": "svKQ8CX1NG1" },
  { "3cd7ef9c-26fe-102b-80cb-0017a47871b2": "k5rhaBb4Vxl" },
  { "3cd7f118-26fe-102b-80cb-0017a47871b2": "i8AQ5keQ28R" },
  { "3cd7f294-26fe-102b-80cb-0017a47871b2": "oEspstl5HfP" },
  { "3cd4a882-26fe-102b-80cb-0017a47871b2": "Tgt3yKYd2oD" },
  { "a5694b2e-22f0-487d-a22d-06771ae6b82d": "G3dUs7PuDqx" },
  { "f0e8e8a2-11a9-4c58-87f1-daee5c284183": "lrM4jhiDogd" },
  { "9034caa2-843e-4124-b64d-71b1fffd9ff0": "yzNVLmfly35" },
  { "3cdc0d7a-26fe-102b-80cb-0017a47871b2": "gH0EgH6sS1Z" },
  { "3ceb0ed8-26fe-102b-80cb-0017a47871b2": "UKKOKMZFOx0" },
  { "5269c451-2a5a-4a54-ac8b-bae388e58a82": "hwYeeeJWm3T" },
  { "08176d5d-3cbe-4c40-8436-26b2e26a1acf": "weBH1mytURu" },
  { "df4149ae-4181-4649-8eb3-6b8c7ab59579": "kmA8X0Qwjor" },
  { "5269c451-2a5a-4a54-ac8b-bae388e58a82": "L9lcjEkxHBv" },
  { "a18bc25f-1757-4568-88a7-d58c4100f7f2": "eCbwnVkQ8Rt" },
  { "3ce2ad10-26fe-102b-80cb-0017a47871b2": "OO8wNkgpAwK" },
  { "3cdef3d2-26fe-102b-80cb-0017a47871b2": "MBJmU3rhpPm" },
  { "3cdef54e-26fe-102b-80cb-0017a47871b2": "nek4WjtVfoT" },
  { "3cdef6c0-26fe-102b-80cb-0017a47871b2": "DftFE82Ae65" },
  { "106e1e0a-40a8-4fcc-9e58-96f69a3693b6": "BMf4geBAMFU" },
  { "6d024c01-dc13-4074-b493-ba72bdb0739e": "yH3otrjN0qZ" },
  { "1e20e234-51d0-47a9-89b2-b359d8520481": "ldCad6nQhDx" },
  { "35b9992e-c5e4-464c-b800-969adcfee12c": "NJPbN9YatIa" },
  { "85a6d158-55ed-4a5f-ac52-ed3ac908afec": "EBAuC7pMu4O" },
  { "3cdbfbc8-26fe-102b-80cb-0017a47871b2": "Gcj9CC1xD4e" },
  { "3cd96052-26fe-102b-80cb-0017a47871b2": "ZZzqnrkube2" },
  { "3ccca7cc-26fe-102b-80cb-0017a47871b2": "ROD5srkOABi" },
  { "ebc286a5-5b09-4960-b1c0-cf76108b70da": "wjqRdfo6VRP" },
  { "cf6b2d18-d38a-11e8-b6e2-0c5b8f279a64": "ChxoqpOQnwh" },
  { "08176d5d-3cbe-4c40-8436-26b2e26a1acf": "h5HoO3NbRSw" }
]

exports.pushFormToDhis2 = function (mappingTable, incomingEncounter, dhsi2Json, callback) {

  if (utils.isFineValue(dhsi2Json) == true && utils.isFineValue(dhsi2Json) == true) {
    var dataValues = [];

    function myLoopA(i) {
      if (i < dhsi2Json.dataValues.length) {
        exports.getValue(mappingTable, incomingEncounter, dhsi2Json.dataValues[i].dataElement, function (result) {
          dataValues.push({ "dataElement": dhsi2Json.dataValues[i].dataElement, "value": result })
          myLoopA(i + 1);
        });
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

        //console.log("what i got ====", options.body)

        request.post(options, function (error, response, body) {
          if (error) {
            callback(error);
          } else {
            var ResponseBody = JSON.parse(body);
            if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.httpStatusCode) == true) {
              if (ResponseBody.httpStatusCode == 200) {
                callback(null, ResponseBody.response.importSummaries[0].reference)
              } else {
                if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.response) == true) {
                  if (utils.isFineValue(ResponseBody.response.importSummaries)== true && utils.isFineValue(ResponseBody.response.importSummaries[0].conflicts== true))  {
                    callback(ResponseBody.message + ' ' + JSON.stringify(ResponseBody.response.importSummaries[0].conflicts[0].value));
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

exports.getValue = function (mappingTable, incomingEncounter, dhis2Id, callback) {
  var mapItem = _.find(mappingTable, function (item) {
    return Object.values(item) == dhis2Id;
  });




  if (utils.isFineValue(mapItem) == true) {

    var concept = _.find(incomingEncounter.encounter.obs, function (item) {
      return item.concept.uuid == Object.keys(mapItem);
    });

    if (utils.isFineValue(concept) == true && utils.isFineValue(concept.display) == true) {
      if (concept.display.includes(":")) { //ensure value not null
        if (utils.isFineValue(concept.value) == true) {

          if (utils.isDate(concept.value) == true) {
            console.log("-> ", concept.value, " is a date");
            callback(utils.convertToDate(concept.value));
          } else {
            if (utils.isNumeric(concept.value) == true) {
              console.log("-> ", concept.value, " is a numeric");
              callback(utils.convertToNumber(concept.value));
            } else {

              if (utils.isObject(concept.value) == true) {

                if (utils.isFineValue(concept.value.name) == true && utils.isFineValue(concept.value.name.uuid) == true) {
                  var mapSubItem = _.find(mappingTable, function (item) {
                    return Object.keys(item) == concept.value.uuid;
                  });
                  if (utils.isFineValue(mapSubItem) == true) {
                    console.log("---> ", " going to get online with with ", Object.values(mapSubItem));

                    utils.getDhis2DropdownValue(Object.values(mapSubItem), function (result) {
                      callback(result);
                    })
                  } else {
                    callback("");
                  }
                } else {
                  callback("");
                }
              } else {
                if (utils.isString(concept.value) == true) {
                  console.log("-> ", concept.value, " is string");
                  callback(concept.value);
                } else {
                  console.log("-> ", concept.value, " is a wierd");
                  callback("");
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

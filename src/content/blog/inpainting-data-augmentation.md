---
author: Matt Franchi
pubDatetime: 2022-10-31T03:30:08.994Z
modDatetime:
title: A Future Method for Data Augmentation? AI-Powered Inpainting
slug: inpainting-data-augmentation
featured: false
draft: false
tags:
  - research
  - artificial intelligence
description:
  I do some exploratory work on how artificial intelligence model training data may be crafted using inpainting with generative AI models.
---

## The State of Data Annotation for Computer Vision
Real data continues to be hard to get. Here is the typical annotation pipeline for a computer vision project. First, researchers look to see if existing labeled datasets can be applied to their use case. Big names here include Common Objects in Common Contexts (MS-COCO), ImageNet, and Cityscapes. If there is sufficient data for the use case, researchers will utilize models pre-trained on these datasets for transfer learning. This approach has the massive benefit of decreasing, or even eliminating, the annotation pipeline of the project. For more niche projects, this is rarely the case. 

For example, in the first research project of my PhD, I need to develop an object detection model for police vehicles in a specific area of the United States. It would be presently impossible to generate a detection model for the term "police vehicle", as vehicle colors, makes, and other characteristics vary from area to area. So, even if labeled police vehicle data were publically available (which, to my best knowledge, it is not), I would likely have trouble utilizing transfer learning. 

So, enter the second, less glamorous approach; accquiring human-labeled data. If you are particularly ambitious (or have lots of time on your hands), you can do this yourself. However, for most research projects, it is more efficient to use project funds and outsource this work to skilled labelers on platforms like Amazon Mechanical Turk or Scale.AI. Most modern models require at least 1,500 images for custom object learning. Once we have a sufficient dataset, we can generate our own model specific to our use case. 

As the size of a project scales, so does the annotation pipeline. Annotation can end up costing either thousands of dollars or hundreds of hours, neither of which are particularly accessible. So, new innovation targets either making labeled data easier to get, or how to make existing data go further.

## Data Augmentation 
Data Augmentation is essentially the "making existing data go further" front of current research. Most popular object detection models levy data augmentation in some way. For example, here are some of the data augmentations that the YOLO (You-Only-Look-Once) realtime detection model incorporates:


| ![YOLO Data Augmentations](@assets/inpainting-data-augmentation/yolo-augmentation.png "YOLO Data Augmentations") | 
|:--:| yol
| *YOLO - Data Augmentations Graphic* |

In YOLO, data augmentation is very easily controlled by adjusting hyperparameters. No manual coding or development is required to enable a host of types of data augmentation, and these techniques offer a proven performance boost. Data augmentation can make a smaller number of images go further during training, and is definitely still a growing field. 

## A New Approach: AI-Powered Inpainting 
With the advent of image synthesis models like OpenAI's DALLE-2 and Stability.AI's Stable Diffusion, I see a potential new method for data augmentation: AI-powered inpainting. This type of context-aware editing could provide high-quality synthetic data of a degree previously unheard of. For example, one could take a manually-labeled image of a Chevy Camaro coupe on the highway and replace it with a Honda Accord sedan. Of course, there are restrictions to this type of augmentation. Here are some initial ones I've come up with: 

* It could be difficult to utilize this process in bulk, especially if training data is captured from different perspectives or other physical conditions. As these generative models take a natural language prompt for inpainting, the text prompt might need to be adjusted for images taken in different conditions. 
* Current stable diffusion models falter at resolutions other than 512x512, as most training images are trained at this resolution. CORRECTION: it seems this is becoming false! Stable Diffusion 2 is capable of generating images up to 2048x2048, which is great! 
* This method is only robust when we want to replace the contents inside the entire bounding box. For example, if we wanted to say, add a red stripe to our Camaro, this would be difficult without some additional preprocessing. 


## Proof-Of-Concept
To see if AI-powered inpainting was even feasible right now, I set out to generate some inpainted training images using Stable Diffusion version 2. I utilize Stability.AI's inpainting version of the model found [here](https://huggingface.co/stabilityai/stable-diffusion-inpainting). My goal is to do exactly what I described above: painting a Honda Accord over a Chevy Camero. I wrote and debugged code in a Jupyter Notebook until I achieved my goal! Here are the results. The initial photo is on the left; the inpainted image is on the right. 

| ![Chevy Camaro - Original Photo](@assets/inpainting-data-augmentation/chevy-camaro.png "Chevy Camaro") | ![Honda Accord - Inpainted](@assets/inpainting-data-augmentation/honda-accord.png "Inpainted Honda Accord") |
|:--:| :--: |
| *Inpainting - "black, new honda accord driving on the road, high resolution"* ||

Pretty realistic! The inpainted image, upon close inspection, isn't quite photorealistic, but I wonder if even in this state it could be useful to a computer vision model. As I gain more bandwith next semester I might explore this idea further. 


## Discussion 
I think this approach could be useful, especially as Stable Diffusion and other generative models continue to become more robust, quick, and realistic. I had a great luxury in utilizing one of my advisor's top-of-the-line RTX A6000 GPUs for this endeavour, and images still took a good 10-15 seconds to generate. Even so, I'm excited to see how these models continue to change the landscape of machine learning, especially as quality labeled data remains elusive and expensive. To my mind, this approach is essentially leveraging transfer learning to insert realistic representations of an object in a setting said object usually occurs in. Some future work I can think of: 
* Exploring how prompt engineering can make generated images more realistic / useful. 
* Trying this approach out in a real project and measuring model performance changes. 
* Exploring the concept of "photorealism" as it applies to computer vision models -- in other words, does training data really need to be photorealistic, or are there more important aspects (such as shape, color, etc.) that mean more to computers? I guess the simplest way I could put this thought is the idea of "What if my 'car' isn't the same as the computer vision model's 'car'"? 

I hope this code and article is useful, and feel free to use it as a baseline for your own projects / explorations! Until next time. 


## Downloadables
* [Project Repo](https://github.com/mattwfranchi/InpaintingDataAugmentation)
---
title: Thm Room Autopsy
date: 2021-05-27T00:31:13+05:30
lastmod: 2021-05-27T00:31:13+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
cover: /img/thm.gif

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm
  - autopsy

draft: false
description: Try Hack Me Room Autopsy solved by Animesh Roy. this is a walkthough. read more...

---
# Autopsy
Learn how to use Autopsy to investigate artifacts from a disk image. Use your knowledge to investigate an employee who is being accused of leaking private company data.


|Profile|Support|
|:-----|-----:|
|<script src="https://tryhackme.com/badge/434937"></script>|<a href="https://www.buymeacoffee.com/anir0y"><img src="https://img.buymeacoffee.com/button-api/?text=Cheers!!!&emoji=🍺&slug=anir0y&button_colour=BD5FFF&font_colour=ffffff&font_family=Lato&outline_colour=000000&coffee_colour=FFDD00"></a>|

<!-- Amazon Ads-->

<script type="text/javascript" language="javascript">
      var aax_size='300x250';
      var aax_pubname = 'anir0y-21';
      var aax_src='302';
    </script>
<script type="text/javascript" language="javascript" src="https://c.amazon-adsystem.com/aax2/assoc.js"></script>
<!-- Amazon Ads-->
---

## Task 01: Introduction

What is [Autopsy](https://www.autopsy.com/)?

The official description: "Autopsy is the premier open source forensics platform which is fast, easy-to-use, and capable of analyzing all types of mobile devices and digital media. Its plug-in architecture enables extensibility from community-developed or custom-built modules. Autopsy evolves to meet the needs of hundreds of thousands of professionals in law enforcement, national security, litigation support, and corporate investigation."

Autopsy is a powerful tool. Several features within Autopsy were developed thanks to the Department of Homeland Security Science and Technology funding. You can read more about this [here](https://www.dhs.gov/science-and-technology/news/2017/12/12/snapshot-st-enhancing-autopsy-digital-forensics-tool). 

### Flags 1.1
|||
|:---:|:---|
|NA|`na`|

---

## Task 02: Installation

Installing Autopsy for Windows is pretty straightforward.

Visit the Autopsy [download page](https://www.autopsy.com/download) and download the Windows MSI, which corresponds to your Windows architecture, 32bit or 64bit. 

1. Run the Autopsy MSI file
2. If Windows prompts with User Account Control, click Yes
3. Click through the dialog boxes until you click a button that says Finish
   
Autopsy is also available for Linux and macOS. Follow the install instructions provided on the Autopsy website. 

If you use Kali Linux, Autopsy is already installed.    
![](https://assets.tryhackme.com/additional/autopsy/autopsy-kali2.png)

---

## Task 03: Workflow Overview

Before diving into Autopsy and analyzing data, there are a few steps to perform, such as identifying the data source and what Autopsy actions to perform with the data source. 

Your basic workflow:

1. Create the case for the data source you will investigate
2. Select the data source you wish to analyze
3. Configure the ingest modules to extract specific artifacts from the data source
4. Review the artifacts extracted by the ingest modules
5. Create the report

Below is a visual of step #1. 

When you start Autopsy, there will be 3 options. To start a new case, click on `New Case`

![](https://i.imgur.com/eaXIpmE.png)

The next screen is titled Case Information, and this is where information about the case is populated.   
![](https://i.imgur.com/59cPhds.png)  

![](https://i.imgur.com/11aCMtf.png)

* **Case Name**: The name you wish to give to the case
* **Base Directory**: The root directory that will store all the files specific to the case (the full path will be displayed)
* **Case Type**: Specify whether this case will be local (Single-user) or hosted on a server where multiple analysts can review (Multi-user)

Note: In this room, the focus is on Single-User.

The screen that follows is titled, Optional Information and it can be left blank for our purposes. In an actual forensic environment, you should fill out this information.  When you're done, click `Finish`. 

In this room, you will import a case. To open a case, you will select is `Open Case`. 

![](https://i.imgur.com/0DaKbH2.png)

Autopsy case files have an `.aut` file extension. Navigate to the case folder and select the .aut file you wish to open. 

![](https://assets.tryhackme.com/additional/autopsy/autopsy-autfile2.png)

Next, Autopsy will process the case files open the case. 

You can identify the name of the case at the top left corner of the Autopsy window. In the image below, the name of this case is Tryhackme

![](https://i.imgur.com/jnKZJuJ.png)

**Note**: If Autopsy is unable to locate the disk image, a warning box will appear. At this point, you can point Autopsy to the location of the disk image it's attempting to find, or you can click NO; you can still analyze the data from the Autopsy case. 

![](https://i.imgur.com/My6C5jC.png)

Once the case you wish to analyze is open, you are ready to start analyzing the data. 

### Flags 3.1
|||
|:---:|:---|
|Autopsy files end with which file extension?|`.aut`|

---

## Task 04: Data Sources

Before diving into analyzing the data, let's briefly cover the different data sources Autopsy can analyze. 

Below is a screenshot of the `Add Data Source` Windows dialog box.    
![](https://i.imgur.com/HEQ70KH.png)

In this room, we will focus primarily on the first option, `Disk Image or VM file`

Supported Disk Image Formats:   
* Raw Single (For example: *.img, *.dd, *.raw, *.bin)
* Raw Split (For example: *.001, *.002, *.aa, *.ab, etc)
* EnCase (For example: *.e01, *.e02, etc)
* Virtual Machines (For example: *.vmdk, *.vhd)

If there are multiple image files (e.i. E01, E02, E03, etc.) Autopsy only needs you to point to the first image file, and Autopsy will handle the rest.  

Note: Refer to the Autopsy [documentation](http://sleuthkit.org/autopsy/docs/user-docs/4.12.0/ds_page.html) to understand the other data sources that can be added to a case. 

Below is a screenshot of an E01 disk image added to a sample case as a data source. 

![](https://i.imgur.com/vLLi9Cl.png)

Specify the time zone and click `Next`. 

Note: Orphan files are deleted files that no longer have a parent folder. In FAT file systems, it can be time-sensitive to read and analyze. 

### Flags-4.1
|||
|:---:|:---|
|In the above screenshot, what is the disk image format for SUSPECTHD?
|`EnCase`|

### Explantion-4.1 
File name ends with `.E01` that's a extention of EnCase.

---

## Task 05: Ingest Modules

Essentially Ingest Modules are Autopsy plug-ins. Each Ingest Module is designed to analyze and retrieve specific data from the drive. 

Below is a screenshot of the `Configure Ingest Modules` window.    

![](https://i.imgur.com/30dd6LE.png)

By default, the Ingest Modules are configured to run on All Files, Directories, and Unallocated Space.    

![](https://i.imgur.com/b7RzSDo.png)

The other two options are:
1. All Files and Directories (Not Unallocated Space)
2. Create/edit file ingest filters

>"Note: not covered ingest filters in this room". 

If all the Ingest Modules are deselected, and `Next` is selected, Autopsy will still process the data source and update the local database

![](https://i.imgur.com/7CHIMik.png)

**Note**: Autopsy adds metadata about files to the local database, not the actual file contents. 

When Autopsy is done, you will see the following: 

![](https://i.imgur.com/lVBLIqC.png)

To complete this process, click `Finish`. 

In the below image, since the Ingest Modules were deselected, there aren't any results in the Results node. 

![](https://i.imgur.com/ZhLvgUj.png)

The results of any Ingest Module you select to run against a data source will populate the Results node in the Tree view, which is the left pane of the Autopsy user interface. 

You can run Ingest Modules at any time while the case is open. To do so, right-click on the data source and select `Run Ingest Modules`. 

![](https://i.imgur.com/tfOzjy8.png)

As Ingest Modules run, alerts may appear in the Ingest Inbox.   
![](https://i.imgur.com/aqdxEMm.png)

Below is an example of the Ingest Inbox after a few Ingest Modules have completed running.

![](https://i.imgur.com/ysjqXIQ.png)

Drawing the attention back to the Configure Ingest Modules window, notice that some Ingest Modules have per-run settings and some do not.

For example, the Recent Activity Ingest Module does not have per-run settings. In contrast, the Hash Lookup Ingest Module does. 

To learn more about Ingest Modules, read Autopsy documentation [here](http://sleuthkit.org/autopsy/docs/user-docs/4.12.0/ingest_page.html). 

### Flags 5.1 
> No flags

---

## Task 06: The User Interface

Let's look at the Autopsy user interface, which is comprised of 5 primary areas: 
  * **Tree Viewer** (Left pane)
  * **Result Viewer** (Top right pane)
  * **Keyword Search** (Upper Top Right)
  * **Contents Viewer** (Bottom right pane)
  * **Status Area** (Lower Bottom right)

Each area will be explained briefly below. 

### Tree Viewer
![](https://i.imgur.com/Ga07qk6.png)

The **Tree Viewer** has 5 top-level nodes:
  * **Data Sources** - all the data will be organized as you would typically see it in a normal Windows File Explorer.
  * **Views** - files will be organized based on file types, MIME types, file size, etc. 
  * **Results** - as mentioned earlier, this is where the results from Ingest Modules will appear.
  * **Tags** - will display files and/or results that have been tagged (read more about tagging [here](http://sleuthkit.org/autopsy/docs/user-docs/4.12.0/tagging_page.html))
  * **Reports** - will display reports either generated by modules or the analyst. (read more about reporting [here](http://sleuthkit.org/autopsy/docs/user-docs/4.12.0/reporting_page.html))

Refer to the Autopsy documentation on the Tree Viewer for more information [here](http://sleuthkit.org/autopsy/docs/user-docs/4.12.0/tree_viewer_page.html).

### Result Viewer

Note: Don't confuse the Results node (from the Tree Viewer) with the Result Viewer. 

When a volume, file, folder, etc., are selected from the Tree Viewer, additional information about the selected item is displayed in the Result Viewer. 

For example, the Sample case's data source is selected, and now additional information is visible in the Results Viewer.

![](https://i.imgur.com/HwtRmc7.png)

If a volume is selected, the Result Viewer's information will change to reflect the information in the local database for the selected volume.   
![](https://i.imgur.com/jlWgNHL.png)

Notice that the Result Viewer pane has 3 tabs: **Table**, **Thumbnail**, and **Summary**. The 2 above screenshots reflect the information displayed in the Table tab.  

The Thumbnail tab works best with image or video files. If the view of the above data is changed from Table to Thumbnail, not much information will be displayed. See below.

![](https://i.imgur.com/eufyl9C.png)

Volume nodes can be expanded, and an analyst can navigate the volume's contents, as they would a typical Windows system. 

![](https://i.imgur.com/mnvz0Bt.png)

In the Views tree node, files are categorized by File Types - By Extension, By MIME Type, Deleted Files, and By File Size.

![](https://i.imgur.com/0e2IdJc.png)

Tip: When it comes to File Types, pay attention to this section. An adversary can rename a file with a misleading file extension. So the file will be 'miscategorized' By Extension but will be categorized appropriately by MIME Type. 

Expand By Extension and more children nodes appear, categorizing files even further (see below).

![](https://i.imgur.com/FzWQwmg.png)

Refer to the Autopsy documentation on the Result Viewer for more information [here](http://sleuthkit.org/autopsy/docs/user-docs/4.12.0/result_viewer_page.html).

### Contents Viewer

From the Table tab in the Result Viewer, if you click any folder/file, additional information is displayed in the Contents Viewer pane. 

![](https://i.imgur.com/n1lCyMI.png)

In the above image, 3 columns might not be quickly understood what they represent. 

  * **S = Score**
  The Score will show a red exclamation point for a folder/file marked/tagged as notable and a yellow triangle pointing downward for a folder/file that is marked/tagged as suspicious. These items can be marked/tagged by an Ingest Module or by the analyst.

* **C = Comment**
  If a yellow page is visible in the Comment column, it will indicate that there is a comment for the folder/file. 

* **O = Occurrence**
  In a nutshell, this column will indicate how many times this file/folder has been seen in past cases (this will require the [Central Repository](http://sleuthkit.org/autopsy/docs/user-docs/4.12.0/central_repo_page.html))

Refer to the Autopsy documentation on the Contents Viewer for more information [here](http://sleuthkit.org/autopsy/docs/user-docs/4.12.0/content_viewer_page.html).

### Keyword Search

At the top right, you will find **Keyword Lists** and **Keyword Search**.

With Keyword Search, an analyst can perform an AD-HOC keyword search. 

![](https://i.imgur.com/qwF9uTV.png)

In the image above, the analyst is searching for the word 'secret.' Below are the search results. 

![](https://i.imgur.com/5bVyN4c.png)

Refer to the Autopsy [documentation](http://sleuthkit.org/autopsy/docs/user-docs/4.12.0/ad_hoc_keyword_search_page.html) for more information on how to perform keyword searches with either option.


### Status Area

Lastly, the Status Area is at the bottom right.

When Ingest Modules are running, a progress bar (along with the percentage completed) will be displayed in this area. If you click on the bar, more detailed information regarding the Ingest Modules is provided.  

![](https://i.imgur.com/e7u4wFA.png)

If the `X` (directly next to the progress bar) is clicked on, a prompt will appear confirming if you wish to end cancel the Ingest Modules. 

Refer to the Autopsy documentation on the UI overview [here](http://sleuthkit.org/autopsy/docs/user-docs/4.12.0/uilayout_page.html). 

---

## Task 07: Data Analysis

**Case Scenario**: An employee was suspected of leaking company data. A disk image was retrieved from the machine. You were assigned to perform the initial analysis. Further action will be determined based on the initial findings. 

**Reminder**: Since the actual disk image is not in the attached VM, certain Autopsy sections will not display any actual data, only the metadata for that row within the local database. You can click No when you're notified about the 'Missing Image.' Additionally, you do not need to run any ingest modules in this exercise. 
![](https://i.imgur.com/pH9PgjS.png)


### Flags-7
|Flag ID|Question|ANS|
|-|:---:|:---|
|1|What is the full name of the operating system version?|`windows 7 ultimate service pack 1`|
|2|What percentage of the drive are documents? Include the % in your answer.|`40.8%`|
|3|The majority of file events occurred on what date? (MONTH DD, YYYY)|`ans`|
|4|What is the name of an Installed Program with the version number of 6.2.0.2962?|`ans`|
|5|Question|`ans`|
|6|Question|`ans`|
|7|Question|`ans`|
|8|Question|`ans`|
|9|Question|`ans`|
|10|Question|`ans`|

### Flag-7.1 
![](https://i.imgur.com/JKXRyqT.png)

### Flag-7.2
Click on Disk -> Listing -> Summery 

![](https://i.imgur.com/I5eFxzr.png)

### Flag-7.3

Summery tab has the answers   

![](https://i.imgur.com/lrXYXXe.png)

### Flag-7.4

![](https://i.imgur.com/CHbc7GT.png)

### Flag-7.5

![](https://i.imgur.com/G02O9te.png)

### Flag-7.6

![](https://i.imgur.com/uF9tzSr.png)

### Flag-7.7

Took me 20 min to figure out, lastly I used the hacky way by looking for search results manually and eye balling. not sure if that was intended way. 

![](https://i.imgur.com/iHGSAea.png)

### Flag-7.8

TimeStamp was helpful 

![](https://i.imgur.com/MStRVyw.png)

### Flag-7.9

![](https://i.imgur.com/3F2vi0u.png)

### Flag-7.10

![](https://i.imgur.com/IDXtMr3.png)


## Task 08: Visualization Tools

![](https://i.imgur.com/MsOZAMp.png)

Please refer to the Autopsy documentation for the following visualization tool:
  * Images/Videos - http://sleuthkit.org/autopsy/docs/user-docs/4.12.0/image_gallery_page.html
  * Communications - http://sleuthkit.org/autopsy/docs/user-docs/4.12.0/communications_page.html
  * Timeline - http://sleuthkit.org/autopsy/docs/user-docs/4.12.0/timeline_page.html

Note: Within the attached VM, you will NOT be able to practice with some of the visualization tools, except for Timeline. 

Below is a screenshot of the Timeline.

![](https://i.imgur.com/fBPPnYz.png)

The Timeline tool is composed of 3 areas:

1. Filters - narrow the events displayed based on the filter criteria
2. Events - the events are displayed here based on the View Mode
3. Files/Contents - additional information on the event(s) is displayed in this area


There are 3 view modes:

1. Counts -  the number of events is displayed in a bar chart view
2. Details - information on events is displayed, but they are clustered and collapsed, so the UI is not overloaded
3. List - the events are displayed in a table view

In the above screenshot, the View Mode is Counts. Below is a screenshot of the Details View Mode. 

![](https://i.imgur.com/RpxQpGf.png)

The numbers (seen above) indicate the number of clustered/collapsed events for a specific time frame.

For example, for /Windows, there are 130,257 events between 2009-06-10 and 2010-03-18. See the below image. 

![](https://i.imgur.com/qCYmWA5.png)

To expand a cluster, click on the `green icon with the plus sign`. See the below example.

![](https://i.imgur.com/goYJm8p.png)

To collapse the events, click on the `red icon with a minus sign`. 
Click the `map marker icon with a plus sign` if you wish to pin a group of events. This will move (pin) the events to an isolated section of the Events view. 

![](https://i.imgur.com/tj8eHlW.png)

To unpin the events, click on the `map marker with the minus sign`. 

The last group of icons to cover are the `eye` icons. If you wish to hide a group of events from the Events view, click on the `eye with a minus sign`. 

In the below screenshot, the clustered events for /Boot were hidden and were placed in `Hidden Descriptions` (in the Filters area).

![](https://i.imgur.com/pGPnSfr.png)

If you wish to reverse that action and unhide the events, right-click and select `Unhide and remove from list`. See the below example.

![](https://i.imgur.com/RbGqkHV.png)

Last but not least, below is a screenshot of the List View Mode.

![](https://i.imgur.com/lRHeV9W.png)

This should be enough information to get you started interacting with the Timeline with some level of confidence. 

### Flag8-1
#### Using the Timeline, how many results were there on 2015-01-12? `46`

![](https://i.imgur.com/8fXs1tu.png)

---

## Task 9: Conclusion

To conclude, there is more to Autopsy that wasn't covered in detail within this room. 

Below are some topics that you should explore on your own to configure Autopsy to do more out of the box:
* Global Hash Lookup Settings
* Global File Extension Mismatch Identification Settings
* Global Keyword Search Settings
* Global Interesting Items Settings
* Yara Analyzer

3rd Party [modules](http://sleuthkit.org/autopsy/docs/user-docs/4.12.0/module_install_page.html) are available for Autopsy. Visit the official SleuthKit GitHub repo for a list of 3rd party modules [here](https://github.com/sleuthkit/autopsy_addon_modules).

The disk image used with this room's development was created and released by the NIST under the Computer Forensic Reference Data Sets (CFReDS) Project. It is encouraged to download the disk image, go through the full exercise ([here](https://www.cfreds.nist.gov/data_leakage_case/data-leakage-case.html)) to practice using Autopsy, and level up your investigation techniques. 



<!-- Amazon Ads-->

<script type="text/javascript" language="javascript">
      var aax_size='300x250';
      var aax_pubname = 'anir0y-21';
      var aax_src='302';
    </script>
<script type="text/javascript" language="javascript" src="https://c.amazon-adsystem.com/aax2/assoc.js"></script>
<!-- Amazon Ads-->

---